
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, Promo, PromoClaim, Blog, FAQ } from '../types';

const SUPABASE_URL = 'https://otkcuoadwnuaakpssiqe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90a2N1b2Fkd251YWFrcHNzaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDcwMTQsImV4cCI6MjA4NTIyMzAxNH0.3DhMAGcl4WLSOH7TvDt39yYS2O2MHwr-UdnROyQtLwY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LOCAL_STORAGE_KEY = 'dm_loyalty_data';

interface LocalData {
  users: User[];
  promos: Promo[];
  claims: PromoClaim[];
  blogs: Blog[];
  faqs: FAQ[];
}

export class StorageService {
  private static getLocalData(): LocalData {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const defaultData: LocalData = { users: [], promos: [], claims: [], blogs: [], faqs: [] };
    if (!data) return defaultData;
    try {
      const parsed = JSON.parse(data);
      return { ...defaultData, ...parsed };
    } catch (e) {
      return defaultData;
    }
  }

  private static saveLocalData(data: LocalData) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }

  private static generateId(): string { return crypto.randomUUID(); }

  private static notifyUpdate() {
    window.dispatchEvent(new Event('user-data-updated'));
  }

  static subscribeToUpdates(callback: () => void) {
    const storageHandler = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) callback();
    };
    
    const customEventHandler = () => callback();

    window.addEventListener('storage', storageHandler);
    window.addEventListener('user-data-updated', customEventHandler);
    
    const channelId = `dm-loyalty-${this.generateId()}`;
    const supabaseSub = supabase.channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_users' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_promos' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_promo_claims' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_blogs' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_faqs' }, () => callback())
      .subscribe();

    return {
      unsubscribe: () => {
        window.removeEventListener('storage', storageHandler);
        window.removeEventListener('user-data-updated', customEventHandler);
        supabase.removeChannel(supabaseSub);
      }
    };
  }

  static async seedInitialData() {
    try {
      const { INITIAL_USERS } = await import('../constants');
      const localData = this.getLocalData();
      
      // Seed Local
      if (localData.users.length === 0) {
        localData.users = [...INITIAL_USERS];
        this.saveLocalData(localData);
      }

      // Seed Supabase
      for (const user of INITIAL_USERS) {
        const { data, error } = await supabase.from('dm_users').select('id').eq('phone', user.phone).maybeSingle();
        if (!data && !error) {
          await this.saveUser(user);
        }
      }
    } catch (e) {
      console.error('Failed to seed initial data:', e);
    }
  }

  static async getUserByPhone(phone: string): Promise<User | null> {
    // Try Supabase first
    try {
      const { data, error } = await supabase.from('dm_users').select('*').eq('phone', phone).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          phone: data.phone,
          role: data.role as UserRole,
          isMember: data.is_member || false,
          memberSince: data.member_since
        };
      }
    } catch (e) {
      console.error('Supabase error:', e);
    }

    // Fallback to Local
    const localData = this.getLocalData();
    return localData.users.find(u => u.phone === phone) || null;
  }

  static async getUsers(): Promise<User[]> { 
    try {
      const { data, error } = await supabase.from('dm_users').select('*').order('name', { ascending: true }); 
      if (error) {
        console.error('Supabase getUsers Error:', error);
      } else if (data) {
        return data.map(u => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role as UserRole,
          isMember: u.is_member || false,
          memberSince: u.member_since
        }));
      }
    } catch (e) {
      console.error('Supabase getUsers Exception:', e);
    }

    console.log('Falling back to local data for getUsers');
    return this.getLocalData().users;
  }

  static async saveUser(user: Partial<User>) { 
    const newUser: User = {
      id: user.id || this.generateId(),
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || UserRole.CUSTOMER,
      isMember: user.isMember ?? false,
      memberSince: user.memberSince || (user.isMember ? new Date().toISOString() : undefined)
    };

    console.log('Saving user:', newUser);

    // Save Local
    const localData = this.getLocalData();
    const index = localData.users.findIndex(u => u.id === newUser.id || u.phone === newUser.phone);
    if (index >= 0) {
      localData.users[index] = { ...localData.users[index], ...newUser };
    } else {
      localData.users.push(newUser);
    }
    this.saveLocalData(localData);

    // Save Supabase
    try {
      const dbUser = {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        is_member: newUser.isMember,
        member_since: newUser.memberSince
      };
      const { error } = await supabase.from('dm_users').upsert(dbUser); 
      if (error) {
        console.error('Supabase Upsert Error:', error);
        throw new Error(`Database Error: ${error.message}`);
      }
      console.log('User saved to Supabase successfully');
    } catch (e) {
      console.error('Supabase Exception during saveUser:', e);
      throw e; // Re-throw to be caught by the UI
    }

    this.notifyUpdate(); 
  }

  static async registerMember(name: string, phone: string) {
    const existing = await this.getUserByPhone(phone);
    if (existing) {
      await this.saveUser({ ...existing, isMember: true, memberSince: new Date().toISOString() });
    } else {
      await this.saveUser({
        name,
        phone,
        role: UserRole.CUSTOMER,
        isMember: true,
        memberSince: new Date().toISOString()
      });
    }
  }

  // --- PROMO LOGIC ---
  static async getPromos(): Promise<Promo[]> {
    try {
      const { data, error } = await supabase.from('dm_promos').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: p.image_url,
          claimLimit: p.claim_limit,
          totalQuota: p.total_quota,
          isActive: p.is_active,
          isFlashSale: p.is_flash_sale || false,
          endTime: p.end_time,
          createdAt: p.created_at
        }));
      }
    } catch (e) {}

    return this.getLocalData().promos;
  }

  static async addPromo(promo: Partial<Promo>) {
    const newPromo: Promo = {
      id: this.generateId(),
      title: promo.title || '',
      description: promo.description || '',
      imageUrl: promo.imageUrl,
      claimLimit: promo.claimLimit || 1,
      totalQuota: promo.totalQuota,
      isActive: true,
      isFlashSale: promo.isFlashSale || false,
      endTime: promo.endTime,
      createdAt: new Date().toISOString()
    };

    // Local
    const data = this.getLocalData();
    data.promos.unshift(newPromo);
    this.saveLocalData(data);

    // Supabase
    try {
      await supabase.from('dm_promos').insert({
        id: newPromo.id,
        title: newPromo.title,
        description: newPromo.description,
        image_url: newPromo.imageUrl,
        claim_limit: newPromo.claimLimit,
        total_quota: newPromo.totalQuota,
        is_active: true,
        is_flash_sale: newPromo.isFlashSale,
        end_time: newPromo.endTime,
        created_at: newPromo.createdAt
      });
    } catch (e) {}

    this.notifyUpdate();
  }

  static async updatePromo(id: string, promo: Partial<Promo>) {
    // Local
    const data = this.getLocalData();
    const index = data.promos.findIndex(p => p.id === id);
    if (index >= 0) {
      data.promos[index] = { ...data.promos[index], ...promo };
      this.saveLocalData(data);
    }

    // Supabase
    try {
      await supabase.from('dm_promos').update({
        title: promo.title,
        description: promo.description,
        image_url: promo.imageUrl,
        claim_limit: promo.claimLimit,
        total_quota: promo.totalQuota,
        is_active: promo.isActive,
        is_flash_sale: promo.isFlashSale,
        end_time: promo.endTime
      }).eq('id', id);
    } catch (e) {}

    this.notifyUpdate();
  }

  static async deletePromo(id: string) {
    // Local
    const data = this.getLocalData();
    data.promos = data.promos.filter(p => p.id !== id);
    this.saveLocalData(data);

    // Supabase
    try {
      await supabase.from('dm_promos').delete().eq('id', id);
    } catch (e) {}

    this.notifyUpdate();
  }

  // --- CLAIM LOGIC ---
  static async getClaims(userId: string): Promise<PromoClaim[]> {
    try {
      const { data, error } = await supabase.from('dm_promo_claims').select('*').eq('user_id', userId);
      if (!error && data) {
        return data.map(c => ({
          id: c.id,
          promoId: c.promo_id,
          userId: c.user_id,
          claimedAt: c.claimed_at,
          status: c.status as 'claimed' | 'used',
          usedAt: c.used_at
        }));
      }
    } catch (e) {}

    return this.getLocalData().claims.filter(c => c.userId === userId);
  }

  static async getAllClaims(): Promise<PromoClaim[]> {
    try {
      const { data, error } = await supabase.from('dm_promo_claims').select('*');
      if (!error && data) {
        return data.map(c => ({
          id: c.id,
          promoId: c.promo_id,
          userId: c.user_id,
          claimedAt: c.claimed_at,
          status: c.status as 'claimed' | 'used',
          usedAt: c.used_at
        }));
      }
    } catch (e) {}

    return this.getLocalData().claims;
  }

  static async claimPromo(userId: string, promoId: string) {
    // 1. Get the latest promo data
    const { data: promoData, error: promoError } = await supabase
      .from('dm_promos')
      .select('*')
      .eq('id', promoId)
      .single();

    if (promoError || !promoData) throw new Error("Promo tidak ditemukan.");
    
    const promo: Promo = {
      id: promoData.id,
      title: promoData.title,
      description: promoData.description,
      imageUrl: promoData.image_url,
      claimLimit: promoData.claim_limit,
      isActive: promoData.is_active,
      isFlashSale: promoData.is_flash_sale,
      totalQuota: promoData.total_quota,
      endTime: promoData.end_time,
      createdAt: promoData.created_at || new Date().toISOString()
    };

    // 2. Check global quota (MOST CRITICAL)
    if (promo.totalQuota && promo.totalQuota > 0) {
      const { count, error: countError } = await supabase
        .from('dm_promo_claims')
        .select('*', { count: 'exact', head: true })
        .eq('promo_id', promoId);
      
      if (countError) throw new Error("Gagal memverifikasi kuota.");
      if (count !== null && count >= promo.totalQuota) {
        throw new Error("Maaf, stok promo ini sudah habis baru saja!");
      }
    }

    // 3. Check user's personal limit
    const { data: userClaims, error: userClaimsError } = await supabase
      .from('dm_promo_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('promo_id', promoId);

    if (userClaimsError) throw new Error("Gagal memverifikasi limit klaim.");
    if (userClaims && userClaims.length >= promo.claimLimit) {
      throw new Error("Anda sudah mencapai batas klaim untuk promo ini.");
    }

    const newClaim: PromoClaim = {
      id: this.generateId(),
      promoId,
      userId,
      claimedAt: new Date().toISOString(),
      status: 'claimed'
    };

    // Supabase Insert
    const { error: insertError } = await supabase.from('dm_promo_claims').insert({
      id: newClaim.id,
      promo_id: promoId,
      user_id: userId,
      claimed_at: newClaim.claimedAt,
      status: 'claimed'
    });

    if (insertError) {
      throw new Error("Gagal melakukan klaim. Silakan coba lagi.");
    }

    // Local update (optional but good for immediate feedback)
    const localData = this.getLocalData();
    localData.claims.push(newClaim);
    this.saveLocalData(localData);

    this.notifyUpdate();
  }

  static async redeemPromo(claimId: string) {
    const usedAt = new Date().toISOString();

    // Local
    const data = this.getLocalData();
    const index = data.claims.findIndex(c => c.id === claimId);
    if (index >= 0) {
      data.claims[index].status = 'used';
      data.claims[index].usedAt = usedAt;
      this.saveLocalData(data);
    }

    // Supabase
    try {
      await supabase.from('dm_promo_claims').update({
        status: 'used',
        used_at: usedAt
      }).eq('id', claimId);
    } catch (e) {}

    this.notifyUpdate();
  }

  // --- BLOG LOGIC ---
  static async getBlogs(): Promise<Blog[]> {
    try {
      const { data, error } = await supabase.from('dm_blogs').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(b => ({
          id: b.id,
          title: b.title,
          content: b.content,
          imageUrl: b.image_url,
          author: b.author,
          createdAt: b.created_at,
          isPublished: b.is_published
        }));
      }
    } catch (e) {}
    return this.getLocalData().blogs.filter(b => b.isPublished);
  }

  static async saveBlog(blog: Partial<Blog>) {
    const id = blog.id || this.generateId();
    const newBlog: Blog = {
      id,
      title: blog.title || '',
      content: blog.content || '',
      imageUrl: blog.imageUrl,
      author: blog.author,
      createdAt: blog.createdAt || new Date().toISOString(),
      isPublished: blog.isPublished ?? true
    };

    const data = this.getLocalData();
    const index = data.blogs.findIndex(b => b.id === id);
    if (index >= 0) data.blogs[index] = newBlog;
    else data.blogs.unshift(newBlog);
    this.saveLocalData(data);

    try {
      await supabase.from('dm_blogs').upsert({
        id: newBlog.id,
        title: newBlog.title,
        content: newBlog.content,
        image_url: newBlog.imageUrl,
        author: newBlog.author,
        created_at: newBlog.createdAt,
        is_published: newBlog.isPublished
      });
    } catch (e) {}
    this.notifyUpdate();
  }

  // --- FAQ LOGIC ---
  static async getFAQs(): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase.from('dm_faqs').select('*').order('order_index', { ascending: true });
      if (!error && data) {
        return data.map(f => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          orderIndex: f.order_index
        }));
      }
    } catch (e) {}
    return this.getLocalData().faqs.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  static async saveFAQ(faq: Partial<FAQ>) {
    const id = faq.id || this.generateId();
    const newFAQ: FAQ = {
      id,
      question: faq.question || '',
      answer: faq.answer || '',
      orderIndex: faq.orderIndex || 0
    };

    const data = this.getLocalData();
    const index = data.faqs.findIndex(f => f.id === id);
    if (index >= 0) data.faqs[index] = newFAQ;
    else data.faqs.push(newFAQ);
    this.saveLocalData(data);

    try {
      await supabase.from('dm_faqs').upsert({
        id: newFAQ.id,
        question: newFAQ.question,
        answer: newFAQ.answer,
        order_index: newFAQ.orderIndex
      });
    } catch (e) {}
    this.notifyUpdate();
  }

  static sendWhatsApp(phone: string, message: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}
