
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, Promo, UserRole, Blog, FAQ, PromoClaim } from '../types';
import { Card, Button, Badge, Input } from '../components/UI';
import { Gift, Users, Plus, X, Edit2, Trash2, Search, CreditCard, QrCode, Newspaper, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const AdminCentral: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'member' | 'promo' | 'scanner' | 'blog' | 'faq'>('member');
  const [members, setMembers] = useState<User[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<Promo>>({
    title: '', description: '', claimLimit: 1, isActive: true, isFlashSale: false, totalQuota: 100, endTime: ''
  });

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogForm, setBlogForm] = useState<Partial<Blog>>({
    title: '', content: '', imageUrl: '', author: 'Admin', isPublished: true
  });

  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState<Partial<FAQ>>({
    question: '', answer: '', orderIndex: 0
  });

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '' });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scannedClaim, setScannedClaim] = useState<{claim: PromoClaim, promo: Promo, user: User} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const sub = StorageService.subscribeToUpdates(() => loadData());
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (activeTab === 'scanner') {
      // Initialize scanner only once when tab is active
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((result) => {
        setScanResult(result);
        handleScan(result);
      }, (error) => {
        // console.warn(error);
      });
    }
    return () => { 
      if (scanner) {
        scanner.clear().catch(e => console.warn("Failed to clear scanner", e));
      }
    };
  }, [activeTab]);

  const loadData = async () => {
    const [allUsers, allPromos, allBlogs, allFaqs] = await Promise.all([
      StorageService.getUsers(),
      StorageService.getPromos(),
      StorageService.getBlogs(),
      StorageService.getFAQs()
    ]);
    setMembers(allUsers.filter(u => u.role === UserRole.CUSTOMER && u.isMember));
    setPromos(allPromos);
    setBlogs(allBlogs);
    setFaqs(allFaqs);
  };

  const handleScan = async (claimId: string) => {
    if (redeemStatus === 'loading') return;
    setRedeemStatus('loading');
    try {
      const allClaims = await StorageService.getAllClaims();
      // Try exact match first, then try prefix match for manual input
      let claim = allClaims.find(c => c.id === claimId);
      
      if (!claim && claimId.length >= 6) {
        claim = allClaims.find(c => c.id.slice(0, 8).toUpperCase() === claimId.toUpperCase());
      }
      
      if (claim) {
        const allUsers = await StorageService.getUsers();
        const user = allUsers.find(u => u.id === claim.userId);
        const promo = promos.find(p => p.id === claim.promoId);
        
        if (user && promo) {
          if (claim.status === 'used') {
            alert('Voucher ini sudah pernah digunakan!');
            setRedeemStatus('error');
          } else {
            setScannedClaim({ claim, promo, user });
            setRedeemStatus('success');
          }
        } else {
          alert('Data user atau promo tidak ditemukan.');
          setRedeemStatus('error');
        }
      } else {
        alert('Voucher tidak valid!');
        setRedeemStatus('error');
      }
    } catch (e) {
      setRedeemStatus('error');
    }
  };

  const confirmRedeem = async () => {
    if (!scannedClaim) return;
    try {
      await StorageService.redeemPromo(scannedClaim.claim.id);
      alert('✅ Voucher Berhasil Ditukarkan!');
      setScannedClaim(null);
      setScanResult(null);
      setManualCode('');
      setRedeemStatus('idle');
      loadData();
    } catch (e) {
      alert('Gagal menukarkan voucher');
    }
  };

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSavePromo = async () => {
    try {
      if (!promoForm.title || !promoForm.description) {
        alert('Harap isi Nama dan Deskripsi!'); return;
      }
      if (editingPromo) {
        await StorageService.updatePromo(editingPromo.id, promoForm);
      } else {
        await StorageService.addPromo(promoForm);
      }
      setShowPromoForm(false);
      loadData();
    } catch (e) { alert('Gagal menyimpan promo'); }
  };

  const handleDeletePromo = async (id: string) => {
    if (confirmDeleteId === id) {
      try {
        await StorageService.deletePromo(id);
        setConfirmDeleteId(null);
        loadData();
      } catch (e) { alert('Gagal menghapus promo.'); }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleRegisterMember = async () => {
    if (isSubmitting) return;
    try {
      const cleanPhone = newMember.phone.replace(/[^0-9]/g, '');
      if (!newMember.name || !cleanPhone) {
        alert('Harap isi Nama dan Nomor HP dengan benar!'); return;
      }
      
      console.log('Attempting to register member:', { name: newMember.name, phone: cleanPhone });
      setIsSubmitting(true);
      
      await StorageService.registerMember(newMember.name, cleanPhone);
      
      console.log('Registration call completed');
      alert('✅ Member Berhasil Didaftarkan!');
      
      setShowMemberForm(false);
      setNewMember({ name: '', phone: '' });
      await loadData(); 
    } catch (e: any) { 
      console.error('Registration Error:', e);
      alert(`❌ Gagal mendaftarkan member: ${e.message || 'Terjadi kesalahan sistem'}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-8 pb-12 text-chocolate">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Dashboard Kasir</h1>
          <p className="text-chocolate-light font-medium text-sm">Kelola Member, Promo, Blog, & FAQ.</p>
        </div>
        <div className="flex gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-orange-50 overflow-x-auto no-scrollbar">
          {(['scanner', 'member', 'promo', 'blog', 'faq'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl capitalize transition-all whitespace-nowrap text-[10px] font-black ${activeTab === tab ? 'bg-honey text-chocolate-dark shadow-md' : 'text-chocolate-light hover:bg-orange-50'}`}>
              {tab === 'scanner' && 'Scan QR'}
              {tab === 'member' && 'Member'}
              {tab === 'promo' && 'Promo'}
              {tab === 'blog' && 'Blog'}
              {tab === 'faq' && 'FAQ'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'scanner' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 text-center border-4 border-honey rounded-[3rem]">
            <h3 className="text-2xl font-black mb-4">Penukaran Voucher</h3>
            <p className="text-sm text-chocolate-light font-bold mb-8">Scan QR Code atau masukkan kode manual.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-[10px] font-black text-chocolate-light uppercase tracking-widest text-left">Metode 1: Scan QR</div>
                <div id="reader" className="overflow-hidden rounded-3xl border-2 border-orange-100 bg-orange-50/30 min-h-[300px]"></div>
              </div>

              <div className="space-y-4 flex flex-col justify-center">
                <div className="text-[10px] font-black text-chocolate-light uppercase tracking-widest text-left">Metode 2: Input Manual</div>
                <div className="space-y-3">
                  <Input 
                    label="Kode Voucher" 
                    placeholder="Contoh: A1B2C3D4" 
                    value={manualCode} 
                    onChange={e => setManualCode(e.target.value.toUpperCase())} 
                  />
                  <Button 
                    onClick={() => handleScan(manualCode)} 
                    className="w-full py-4 shadow-lg shadow-honey/20"
                    disabled={!manualCode || redeemStatus === 'loading'}
                  >
                    {redeemStatus === 'loading' ? 'MENGECEK...' : 'CEK KODE VOUCHER'}
                  </Button>
                </div>
              </div>
            </div>

            {scannedClaim && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-chocolate/60 backdrop-blur-sm">
                <Card className="w-full max-w-lg p-8 rounded-[2.5rem] border-4 border-honey animate-in zoom-in duration-300">
                  <div className="bg-green-50 p-8 rounded-[2.5rem] border-2 border-green-100 mb-6">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h4 className="text-xl font-black text-green-700">Voucher Valid!</h4>
                    <div className="mt-6 space-y-2 text-left bg-white p-6 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-chocolate-light uppercase tracking-widest">Pelanggan:</p>
                      <p className="text-lg font-black text-chocolate">{scannedClaim.user.name} ({scannedClaim.user.phone})</p>
                      <div className="pt-4 border-t border-orange-50">
                        <p className="text-xs font-bold text-chocolate-light uppercase tracking-widest">Voucher:</p>
                        <p className="text-lg font-black text-honey-dark">{scannedClaim.promo.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={confirmRedeem} className="flex-grow py-4 shadow-xl shadow-honey/20">KONFIRMASI PENUKARAN</Button>
                    <Button variant="outline" onClick={() => { setScannedClaim(null); setRedeemStatus('idle'); }} className="py-4">BATAL</Button>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'member' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-chocolate-light" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau nomor HP..." 
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-orange-50 rounded-2xl outline-none focus:border-honey transition-all font-bold text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowMemberForm(true)} className="flex items-center gap-2 w-full md:w-auto shadow-lg hover:shadow-honey/20">
              <Plus size={18} /> DAFTAR MEMBER BARU
            </Button>
          </div>

          <Card className="p-0 overflow-hidden rounded-3xl border-2 border-orange-50 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-orange-50 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="p-6">Nama Member</th>
                    <th className="p-6">Nomor Handphone</th>
                    <th className="p-6">Member Sejak</th>
                    <th className="p-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {filteredMembers.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-chocolate-light font-bold italic">Tidak ada data member.</td></tr>
                  ) : filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-honey/10 p-2 rounded-lg text-honey-dark"><CreditCard size={16} /></div>
                          <span className="font-black">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-6 font-bold text-chocolate-light">{m.phone}</td>
                      <td className="p-6 text-xs font-bold text-chocolate-light">{m.memberSince ? new Date(m.memberSince).toLocaleDateString('id', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
                      <td className="p-6">
                        <Button variant="outline" className="text-[10px] px-4 py-1.5" onClick={() => StorageService.sendWhatsApp(m.phone, `Halo ${m.name}, selamat datang di Member Card Donat Madu! 🍩`)}>HUBUNGI</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'promo' && (
        <div className="space-y-10">
          {/* Flash Sale Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2 text-red-600"><Clock size={20} /> Flash Sale Aktif</h3>
              <Button onClick={() => { setEditingPromo(null); setPromoForm({ title: '', description: '', claimLimit: 1, isActive: true, isFlashSale: true, totalQuota: 100 }); setShowPromoForm(true); }} className="bg-red-500 hover:bg-red-600 text-white shadow-red-100">
                <Plus size={18} className="mr-2" /> BUAT FLASH SALE
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.filter(p => p.isFlashSale).map(p => (
                <Card key={p.id} className="group hover:border-red-200 transition-all duration-300 rounded-[2rem] flex flex-col h-full relative overflow-hidden border-2 border-red-50">
                  <div className="absolute top-4 right-4 z-10">
                    <Badge color="red" className="animate-pulse">FLASH SALE</Badge>
                  </div>
                  <div className="p-6">
                    <div className="bg-red-50 p-3 rounded-2xl text-red-500 w-fit mb-4">
                      <Clock size={24} />
                    </div>
                    <h4 className="font-black text-xl mb-1">{p.title}</h4>
                    <p className="text-xs text-chocolate-light font-bold mb-4 line-clamp-2">{p.description}</p>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-chocolate-light">
                        <span>Quota: {p.totalQuota || '∞'}</span>
                        <span>Selesai: {p.endTime ? new Date(p.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setEditingPromo(p); setPromoForm(p); setShowPromoForm(true); }} className="flex-grow py-2 bg-orange-50 rounded-xl text-[10px] font-black hover:bg-honey transition-colors">EDIT</button>
                        <button 
                          onClick={() => handleDeletePromo(p.id)} 
                          className={`p-2 rounded-xl transition-all flex items-center gap-1 ${confirmDeleteId === p.id ? 'bg-red-500 text-white px-3' : 'text-red-500 hover:bg-red-50'}`}
                        >
                          {confirmDeleteId === p.id ? <span className="text-[10px] font-black">YAKIN?</span> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {promos.filter(p => p.isFlashSale).length === 0 && (
                <div className="col-span-full py-10 text-center bg-red-50/30 rounded-[2rem] border-2 border-dashed border-red-100">
                  <p className="text-sm font-bold text-red-400">Belum ada Flash Sale aktif.</p>
                </div>
              )}
            </div>
          </div>

          {/* Regular Promo Section */}
          <div className="space-y-6 pt-6 border-t border-orange-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><Gift size={20} className="text-honey-dark" /> Promo Reguler</h3>
              <Button onClick={() => { setEditingPromo(null); setPromoForm({ title: '', description: '', claimLimit: 1, isActive: true, isFlashSale: false }); setShowPromoForm(true); }}>
                <Plus size={18} className="mr-2" /> BUAT PROMO REGULER
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promos.filter(p => !p.isFlashSale).map(p => (
                <Card key={p.id} className="group hover:border-honey transition-all duration-300 rounded-[2rem] flex flex-col h-full relative overflow-hidden">
                  {!p.isActive && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center font-black text-red-500 uppercase tracking-widest backdrop-blur-[1px]">Non-Aktif</div>}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-honey/10 p-3 rounded-2xl text-honey-dark group-hover:bg-honey group-hover:text-white transition-colors">
                        <Gift size={24} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingPromo(p); setPromoForm(p); setShowPromoForm(true); }} className="p-2 text-chocolate-light hover:text-honey transition-colors"><Edit2 size={16} /></button>
                        <button 
                          onClick={() => handleDeletePromo(p.id)} 
                          className={`p-2 rounded-xl transition-all flex items-center gap-1 ${confirmDeleteId === p.id ? 'bg-red-500 text-white px-3' : 'text-chocolate-light hover:text-red-500'}`}
                        >
                          {confirmDeleteId === p.id ? <span className="text-[10px] font-black">HAPUS?</span> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                    <h4 className="font-black text-xl mb-1">{p.title}</h4>
                    <p className="text-xs text-chocolate-light font-bold mb-4 line-clamp-3">{p.description}</p>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-chocolate-light">
                        <span>Quota: {p.totalQuota || '∞'}</span>
                        <span>Limit: {p.claimLimit}x</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-orange-50">
                       <Badge color={p.isActive ? 'green' : 'yellow'} className="text-[10px]">{p.isActive ? 'AKTIF' : 'NON-AKTIF'}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPromoForm && (
        <div className="fixed inset-0 bg-chocolate-dark/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-xl rounded-[2.5rem] border-4 border-honey relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowPromoForm(false)} className="absolute top-6 right-6 text-chocolate-light hover:text-red-500 transition-colors"><X /></button>
            <h3 className="text-2xl font-black mb-6">{editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}</h3>
            <div className="space-y-5">
              <Input label="Judul Promo" placeholder="Contoh: Beli 1 Lusin Gratis 2" value={promoForm.title || ''} onChange={e => setPromoForm({...promoForm, title: e.target.value})} />
              <div className="flex flex-col gap-2">
                <label className="text-chocolate-light font-semibold text-sm">Deskripsi Promo</label>
                <textarea 
                  className="bg-orange-50/50 border border-orange-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-honey-light transition-all h-24 font-bold text-sm"
                  placeholder="Jelaskan detail promo dan syaratnya..."
                  value={promoForm.description || ''} 
                  onChange={e => setPromoForm({...promoForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Limit Klaim per Member" type="number" value={promoForm.claimLimit || 1} onChange={e => setPromoForm({...promoForm, claimLimit: Number(e.target.value)})} />
                <Input label="Total Quota (Stok)" type="number" placeholder="Kosongkan jika tak terbatas" value={promoForm.totalQuota || ''} onChange={e => setPromoForm({...promoForm, totalQuota: e.target.value ? Number(e.target.value) : undefined})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-chocolate-light font-semibold text-sm">Status</label>
                  <select 
                    className="bg-orange-50 border-orange-100 p-3 rounded-xl font-bold text-sm outline-none"
                    value={promoForm.isActive ? 'true' : 'false'}
                    onChange={e => setPromoForm({...promoForm, isActive: e.target.value === 'true'})}
                  >
                    <option value="true">AKTIF</option>
                    <option value="false">NON-AKTIF</option>
                  </select>
                </div>
                {promoForm.isFlashSale && (
                  <Input label="Waktu Berakhir" type="datetime-local" value={formatDateForInput(promoForm.endTime)} onChange={e => setPromoForm({...promoForm, endTime: new Date(e.target.value).toISOString()})} />
                )}
              </div>

              <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="isFlashSale"
                  className="w-5 h-5 accent-red-500"
                  checked={promoForm.isFlashSale || false}
                  onChange={e => setPromoForm({...promoForm, isFlashSale: e.target.checked})}
                />
                <label htmlFor="isFlashSale" className="text-sm font-black text-red-600">Tandai sebagai Flash Sale</label>
              </div>
              <Button className="w-full mt-4 py-4 shadow-honey/20 shadow-lg" onClick={handleSavePromo}>
                {editingPromo ? 'SIMPAN PERUBAHAN' : 'PUBLIKASIKAN PROMO'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black flex items-center gap-2"><Newspaper size={20} className="text-honey-dark" /> Manajemen Blog</h3>
            <Button onClick={() => { setEditingBlog(null); setBlogForm({ title: '', content: '', imageUrl: '', author: 'Admin', isPublished: true }); setShowBlogForm(true); }}>
              <Plus size={18} className="mr-2" /> TULIS BERITA BARU
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map(b => (
              <Card key={b.id} className="rounded-[2rem] overflow-hidden flex flex-col h-full border-2 border-orange-50">
                <div className="h-40 bg-orange-50 overflow-hidden">
                  <img src={b.imageUrl || "https://picsum.photos/seed/donut/800/400"} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-grow">
                  <h4 className="font-black text-lg line-clamp-2 leading-tight mb-2">{b.title}</h4>
                  <p className="text-xs text-chocolate-light font-bold line-clamp-3 leading-relaxed">{b.content}</p>
                </div>
                <div className="p-6 border-t border-orange-50 flex justify-between items-center bg-orange-50/20">
                  <Badge color={b.isPublished ? 'green' : 'gray'}>{b.isPublished ? 'PUBLISHED' : 'DRAFT'}</Badge>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingBlog(b); setBlogForm(b); setShowBlogForm(true); }} className="p-2 text-chocolate-light hover:text-honey"><Edit2 size={18} /></button>
                    <button onClick={async () => { if(confirm('Hapus blog ini?')) { await StorageService.saveBlog({...b, isPublished: false}); loadData(); } }} className="p-2 text-chocolate-light hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black flex items-center gap-2"><MessageCircle size={20} className="text-honey-dark" /> Manajemen FAQ</h3>
            <Button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', orderIndex: faqs.length }); setShowFaqForm(true); }}>
              <Plus size={18} className="mr-2" /> TAMBAH FAQ
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map(f => (
              <Card key={f.id} className="p-8 rounded-[2rem] flex justify-between items-start border-2 border-orange-50 shadow-md">
                <div className="flex-grow pr-4">
                  <h4 className="font-black text-chocolate text-lg mb-2 flex items-start gap-3">
                    <span className="text-honey-dark">Q:</span>
                    {f.question}
                  </h4>
                  <p className="text-sm text-chocolate-light font-bold leading-relaxed pl-7">{f.answer}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingFaq(f); setFaqForm(f); setShowFaqForm(true); }} className="p-2 text-chocolate-light hover:text-honey"><Edit2 size={18} /></button>
                  <button onClick={async () => { if(confirm('Hapus FAQ ini?')) { /* Logic to delete FAQ */ loadData(); } }} className="p-2 text-chocolate-light hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showBlogForm && (
        <div className="fixed inset-0 bg-chocolate-dark/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl rounded-[3rem] border-4 border-honey relative shadow-2xl p-10 animate-in zoom-in duration-300">
            <button onClick={() => setShowBlogForm(false)} className="absolute top-8 right-8 text-chocolate-light hover:text-red-500"><X /></button>
            <h3 className="text-3xl font-black mb-8">{editingBlog ? 'Edit Blog' : 'Tulis Blog Baru'}</h3>
            <div className="space-y-6">
              <Input label="Judul Berita" placeholder="Masukkan judul menarik..." value={blogForm.title || ''} onChange={e => setBlogForm({...blogForm, title: e.target.value})} />
              <Input label="URL Gambar" placeholder="https://..." value={blogForm.imageUrl || ''} onChange={e => setBlogForm({...blogForm, imageUrl: e.target.value})} />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-chocolate-light">Konten Berita</label>
                <textarea 
                  className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl h-48 font-bold text-sm outline-none focus:ring-2 focus:ring-honey transition-all"
                  placeholder="Tulis isi berita di sini..."
                  value={blogForm.content || ''}
                  onChange={e => setBlogForm({...blogForm, content: e.target.value})}
                />
              </div>
              <Button className="w-full py-5 text-lg shadow-xl shadow-honey/20" onClick={async () => { await StorageService.saveBlog(blogForm); setShowBlogForm(false); loadData(); }}>SIMPAN BERITA</Button>
            </div>
          </Card>
        </div>
      )}

      {showFaqForm && (
        <div className="fixed inset-0 bg-chocolate-dark/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-[3rem] border-4 border-honey relative shadow-2xl p-10 animate-in zoom-in duration-300">
            <button onClick={() => setShowFaqForm(false)} className="absolute top-8 right-8 text-chocolate-light hover:text-red-500"><X /></button>
            <h3 className="text-3xl font-black mb-8">{editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
            <div className="space-y-6">
              <Input label="Pertanyaan" placeholder="Apa yang ingin ditanyakan?" value={faqForm.question || ''} onChange={e => setFaqForm({...faqForm, question: e.target.value})} />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-chocolate-light">Jawaban</label>
                <textarea 
                  className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl h-40 font-bold text-sm outline-none focus:ring-2 focus:ring-honey transition-all"
                  placeholder="Tulis jawaban di sini..."
                  value={faqForm.answer || ''}
                  onChange={e => setFaqForm({...faqForm, answer: e.target.value})}
                />
              </div>
              <Button className="w-full py-5 text-lg shadow-xl shadow-honey/20" onClick={async () => { await StorageService.saveFAQ(faqForm); setShowFaqForm(false); loadData(); }}>SIMPAN FAQ</Button>
            </div>
          </Card>
        </div>
      )}

      {showMemberForm && (
        <div className="fixed inset-0 bg-chocolate-dark/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-[2.5rem] border-4 border-honey relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowMemberForm(false)} className="absolute top-6 right-6 text-chocolate-light hover:text-red-500 transition-colors"><X /></button>
            <h3 className="text-2xl font-black mb-6">Daftarkan Member Baru</h3>
            <p className="text-xs font-bold text-chocolate-light mb-6 -mt-4">Pastikan customer sudah berbelanja minimal Rp 80.000.</p>
            <div className="space-y-4">
              <Input label="Nama Lengkap" placeholder="Masukkan nama customer..." value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              <Input label="Nomor Handphone" placeholder="Contoh: 0812..." value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              <Button className="w-full mt-4 py-4" onClick={handleRegisterMember} disabled={isSubmitting}>
                {isSubmitting ? 'MENDAFTARKAN...' : 'KONFIRMASI & DAFTARKAN'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminCentral;
