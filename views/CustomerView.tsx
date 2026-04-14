
import React, { useState, useEffect } from 'react';
import { User, Promo, PromoClaim, Blog, FAQ } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Home, 
  Newspaper, 
  CreditCard, 
  MessageCircle, 
  User as UserIcon, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  Info,
  Ticket,
  Sparkles,
  Search,
  QrCode,
  Download,
  History,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Badge } from '../components/UI';
import { QRCodeSVG } from 'qrcode.react';

interface CustomerViewProps {
  customer: User;
  onLogout: () => void;
}

type TabType = 'home' | 'promo' | 'berita' | 'kartu' | 'faq' | 'profil';

const CustomerView: React.FC<CustomerViewProps> = ({ customer, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [promos, setPromos] = useState<Promo[]>([]);
  const [claims, setClaims] = useState<PromoClaim[]>([]);
  const [allClaims, setAllClaims] = useState<PromoClaim[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PromoClaim | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const loadData = async () => {
    const [allPromos, userClaims, globalClaims, allBlogs, allFaqs] = await Promise.all([
      StorageService.getPromos(),
      StorageService.getClaims(customer.id),
      StorageService.getAllClaims(),
      StorageService.getBlogs(),
      StorageService.getFAQs()
    ]);
    console.log('Data Loaded:', { promos: allPromos.length, userClaims: userClaims.length, globalClaims: globalClaims.length });
    setPromos(allPromos.filter(p => p.isActive));
    setClaims(userClaims);
    setAllClaims(globalClaims);
    setBlogs(allBlogs);
    setFaqs(allFaqs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const sub = StorageService.subscribeToUpdates(loadData);
    
    // Fallback polling every 5 seconds to ensure real-time progress bars
    const pollInterval = setInterval(loadData, 5000);
    
    return () => {
      sub.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [customer.id]);

  const handleClaim = async (promoId: string) => {
    if (isClaiming) return;
    setIsClaiming(true);

    // UI-side pre-check to prevent unnecessary server calls if we already know it's full
    const promo = promos.find(p => p.id === promoId);
    if (promo && promo.totalQuota && promo.totalQuota > 0) {
      const currentClaims = allClaims.filter(c => c.promoId === promoId).length;
      if (currentClaims >= promo.totalQuota) {
        alert('Maaf, stok promo ini baru saja habis!');
        setSelectedPromo(null);
        loadData();
        setIsClaiming(false);
        return;
      }
    }

    try {
      await StorageService.claimPromo(customer.id, promoId);
      setSelectedPromo(null);
      alert('✅ Promo berhasil diklaim!');
      await loadData();
    } catch (e: any) {
      alert(e.message);
      await loadData();
    } finally {
      setIsClaiming(false);
    }
  };

  const renderHeader = () => (
    <header className="flex justify-between items-center px-4 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-40">
      <div className="md:hidden">
        <img src="https://donatmaduindonesia.com/wp-content/uploads/2025/08/Logo-Website.svg" alt="Logo" className="h-10 w-auto" />
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] font-black text-chocolate-light uppercase tracking-widest leading-none">Cabang</p>
        <p className="text-xs md:text-sm font-black text-chocolate tracking-tight">Gunung Batu</p>
      </div>

      <div className="flex items-center gap-3 md:hidden">
        <div className="text-right">
          <p className="text-sm font-black text-chocolate leading-none">{customer.name.split(' ')[0]}</p>
          <p className="text-[10px] font-bold text-honey-dark uppercase tracking-tighter">Member</p>
        </div>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'profil' ? 'bg-chocolate text-white' : 'bg-orange-50 text-chocolate'}`}
        >
          <UserIcon size={20} />
        </button>
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="space-y-12 pb-32 px-1">
      {/* Header Info Desktop Only */}
      <div className="hidden md:flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-chocolate tracking-tight">Halo, {customer.name.split(' ')[0]}!</h2>
          <p className="text-sm text-chocolate-light font-bold flex items-center gap-1">
            <Sparkles size={14} className="text-honey" /> Member Premium Donat Madu
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-black text-chocolate-light uppercase tracking-widest leading-none">Cabang</p>
          <p className="text-lg font-black text-chocolate tracking-tight">Gunung Batu</p>
        </div>

        <button 
          onClick={() => setActiveTab('profil')}
          className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-chocolate hover:bg-chocolate hover:text-white transition-colors"
        >
          <UserIcon size={24} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <Card className="p-6 bg-orange-50/50 border-none flex items-center gap-4 rounded-3xl">
          <div className="w-14 h-14 bg-honey/20 rounded-2xl flex items-center justify-center text-honey-dark">
            <Ticket size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-chocolate-light uppercase tracking-wider">Voucher Saya</p>
            <p className="text-2xl font-black text-chocolate">{claims.filter(c => c.status === 'claimed').length}</p>
          </div>
        </Card>
        <Card className="p-6 bg-orange-50/50 border-none flex items-center gap-4 rounded-3xl">
          <div className="w-14 h-14 bg-orange-200/20 rounded-2xl flex items-center justify-center text-orange-500">
            <Sparkles size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-chocolate-light uppercase tracking-wider">Promo Baru</p>
            <p className="text-2xl font-black text-chocolate">{promos.length}</p>
          </div>
        </Card>
      </div>

      {/* Flash Sale Section */}
      <section className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 mx-1">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white animate-pulse">
              <Clock size={20} />
            </div>
            <h3 className="font-black text-red-600 text-2xl tracking-tight">Flash Sale</h3>
          </div>
          <button onClick={() => setActiveTab('promo')} className="text-sm font-bold text-red-500 hover:underline">Lihat Semua</button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
          {promos.filter(p => p.isFlashSale).map(promo => (
            <div 
              key={promo.id} 
              className="min-w-[280px] md:min-w-[320px] h-full"
            >
              <FlashSaleCard 
                promo={promo} 
                onClaim={setSelectedPromo} 
                totalClaims={allClaims.filter(c => c.promoId === promo.id).length}
              />
            </div>
          ))}
          {promos.filter(p => p.isFlashSale).length === 0 && (
            <div className="w-full text-center py-6">
              <p className="text-sm font-bold text-red-400 italic">Nantikan flash sale berikutnya!</p>
            </div>
          )}
        </div>
      </section>

      {/* Promo Section Summary */}
      <section className="px-1">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-black text-chocolate text-2xl tracking-tight">Promo Terbaru</h3>
          <button onClick={() => setActiveTab('promo')} className="text-sm font-bold text-honey-dark hover:underline">Lihat Semua</button>
        </div>
        <div className="space-y-5">
          {promos.length === 0 ? (
            <p className="text-center py-10 text-sm font-bold text-chocolate-light italic">Belum ada promo aktif...</p>
          ) : (
            promos.filter(p => !p.isFlashSale).slice(0, 3).map(promo => (
              <Card 
                key={promo.id} 
                className="p-0 overflow-hidden border-none shadow-xl shadow-chocolate/5 flex h-32 cursor-pointer rounded-3xl group hover:scale-[1.01] transition-transform" 
                onClick={() => setActiveTab('promo')}
              >
                <div className="w-32 h-full bg-orange-50 flex-shrink-0 overflow-hidden">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-200"><Ticket size={36} /></div>
                  )}
                </div>
                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <h4 className="font-black text-chocolate text-base leading-tight line-clamp-2 mb-1">{promo.title}</h4>
                    <p className="text-[10px] text-chocolate-light font-bold line-clamp-1">{promo.description}</p>
                  </div>
                  <div className="text-xs font-black text-honey-dark flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Lihat Detail Promo <ChevronRight size={14} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="px-1">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-black text-chocolate text-2xl tracking-tight">Berita Terbaru</h3>
          <button onClick={() => setActiveTab('berita')} className="text-sm font-bold text-honey-dark hover:underline">Baca Blog</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {blogs.length === 0 ? (
            <p className="text-center py-10 text-sm font-bold text-chocolate-light italic col-span-full">Belum ada berita...</p>
          ) : (
            blogs.slice(0, 2).map((post) => (
              <Card 
                key={post.id} 
                className="p-0 overflow-hidden border-none shadow-xl shadow-chocolate/5 cursor-pointer rounded-3xl group hover:scale-[1.02] transition-transform" 
                onClick={() => { setSelectedBlog(post); setActiveTab('berita'); }}
              >
                <div className="h-40 overflow-hidden">
                  <img src={post.imageUrl || "https://picsum.photos/seed/donut/800/400"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color="yellow" className="text-[8px]">BERITA</Badge>
                    <span className="text-[10px] font-bold text-chocolate-light">{new Date(post.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <h4 className="font-black text-chocolate text-lg leading-tight line-clamp-2 group-hover:text-honey-dark transition-colors">{post.title}</h4>
                  <div className="mt-3 text-xs font-black text-honey-dark flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Baca Selengkapnya <ChevronRight size={14} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* FAQ Section at Bottom of Home */}
      <section className="pt-4 px-1">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-black text-chocolate text-2xl tracking-tight">FAQ</h3>
          <button onClick={() => setActiveTab('faq')} className="text-sm font-bold text-honey-dark hover:underline">Lihat Semua</button>
        </div>
        <div className="space-y-4">
          {faqs.length === 0 ? (
            <p className="text-center py-10 text-sm font-bold text-chocolate-light italic">Belum ada FAQ...</p>
          ) : (
            faqs.slice(0, 3).map((item) => (
              <div key={item.id} className="p-5 bg-white border border-orange-50 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-black text-chocolate text-base mb-2 flex items-start gap-3">
                  <span className="text-honey-dark font-black">Q:</span>
                  {item.question}
                </h4>
                <p className="text-sm text-chocolate-light font-medium leading-relaxed pl-7">{item.answer}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="pt-8 px-1">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-green-200 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-3 tracking-tight">Pesan Donat Sekarang!</h3>
            <p className="text-base font-medium text-green-50 mb-8 opacity-90 leading-relaxed max-w-md">Nikmati kelezatan Donat Madu langsung di rumah Anda. Pesan mudah melalui WhatsApp.</p>
            <a 
              href="https://wa.me/628123456789" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-green-600 px-10 py-5 rounded-2xl font-black text-base shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              <MessageCircle size={24} />
              Hubungi WhatsApp
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 rotate-12">
            <MessageCircle size={220} />
          </div>
        </div>
      </section>
    </div>
  );

  const renderPromo = () => (
    <div className="space-y-12 pb-32 px-1">
      <header className="px-2">
        <h2 className="text-3xl font-black text-chocolate tracking-tight">Promo Spesial</h2>
        <p className="text-sm text-chocolate-light font-bold">Klaim voucher dan nikmati promonya!</p>
      </header>

      {/* Flash Sale Section */}
      {promos.filter(p => p.isFlashSale).length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="bg-red-500 text-white p-1.5 rounded-lg">
              <Clock size={18} />
            </div>
            <h3 className="text-xl font-black text-red-600 tracking-tight uppercase">Flash Sale</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
            {promos.filter(p => p.isFlashSale).map(promo => (
              <FlashSaleCard 
                key={promo.id} 
                promo={promo} 
                onClaim={setSelectedPromo} 
                totalClaims={allClaims.filter(c => c.promoId === promo.id).length}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular Promos */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-honey text-white p-1.5 rounded-lg">
            <Ticket size={18} />
          </div>
          <h3 className="text-xl font-black text-chocolate tracking-tight uppercase">Promo Reguler</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {promos.filter(p => !p.isFlashSale).map((promo) => {
            const userClaims = claims.filter(c => c.promoId === promo.id).length;
            const totalClaimsForThisPromo = allClaims.filter(c => c.promoId === promo.id).length;
            const isLimitReached = userClaims >= promo.claimLimit;
            const isStockOut = promo.totalQuota ? totalClaimsForThisPromo >= promo.totalQuota : false;
            
            const progress = promo.totalQuota && promo.totalQuota > 0 
              ? Math.min(100, (totalClaimsForThisPromo / promo.totalQuota) * 100) 
              : 0;

            return (
              <Card key={promo.id} className="p-0 overflow-hidden border-none shadow-xl shadow-chocolate/5 rounded-[2.5rem] bg-white group flex flex-col h-full">
                <div className="h-48 bg-orange-50 relative flex-shrink-0">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-200"><Ticket size={48} /></div>
                  )}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <Badge color="yellow" className="shadow-lg">LIMIT: {promo.claimLimit}x</Badge>
                    {isStockOut && <Badge color="red" className="shadow-lg animate-bounce">STOK HABIS</Badge>}
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-xl text-chocolate line-clamp-1 mb-2">{promo.title}</h4>
                    <p className="text-sm text-chocolate-light font-bold mb-6 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">{promo.description}</p>
                    
                    {/* Stock Progress Bar for Regular Promo */}
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-chocolate-light uppercase tracking-widest">
                        <span>Sisa: {promo.totalQuota ? Math.max(0, promo.totalQuota - totalClaimsForThisPromo) : 'Terbatas'}</span>
                        <span>{Math.round(progress)}% Terpakai</span>
                      </div>
                      <div className="h-1.5 bg-orange-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full ${progress > 80 ? 'bg-red-400' : 'bg-honey'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-orange-50/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-chocolate-light uppercase tracking-widest">Klaim Saya</span>
                      <span className="text-lg font-black text-chocolate">{userClaims} / {promo.claimLimit}</span>
                    </div>
                    <Button 
                      onClick={() => setSelectedPromo(promo)}
                      disabled={isLimitReached || isStockOut}
                      className={`px-8 py-3 rounded-2xl text-sm font-black shadow-lg transition-all ${
                        isLimitReached || isStockOut 
                        ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed' 
                        : 'shadow-honey/20 bg-honey hover:bg-honey-dark text-white'
                      }`}
                    >
                      {isStockOut ? 'STOK HABIS' : isLimitReached ? 'SUDAH KLAIM' : 'KLAIM VOUCHER'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderBerita = () => {
    if (selectedBlog) {
      return (
        <div className="space-y-8 pb-32 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedBlog(null)}
            className="flex items-center gap-2 text-chocolate-light font-bold hover:text-chocolate transition-colors mb-6 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Berita
          </button>

          <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-chocolate/5 border border-orange-50">
            <div className="h-64 md:h-96 bg-orange-50 relative">
              <img src={selectedBlog.imageUrl || "https://picsum.photos/seed/donut/800/400"} alt={selectedBlog.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Badge color="yellow">BERITA</Badge>
                <span className="text-xs font-black text-chocolate-light uppercase tracking-widest">
                  {new Date(selectedBlog.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-chocolate leading-tight mb-8">{selectedBlog.title}</h2>
              <div className="prose prose-chocolate max-w-none">
                <p className="text-base md:text-lg text-chocolate-light font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedBlog.content}
                </p>
              </div>
              <div className="mt-12 pt-8 border-t border-orange-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-honey/20 rounded-full flex items-center justify-center text-honey-dark">
                  <UserIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-chocolate uppercase tracking-widest">Penulis</p>
                  <p className="text-base font-bold text-chocolate-light">{selectedBlog.author || 'Admin Donat Madu'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-32 px-1">
        <header className="px-2">
          <h2 className="text-3xl font-black text-chocolate tracking-tight">Berita Terbaru</h2>
          <p className="text-sm text-chocolate-light font-bold">Update seputar Donat Madu Cihanjuang</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {blogs.length === 0 ? (
            <div className="col-span-full text-center py-20 opacity-50">
              <Newspaper size={64} className="mx-auto mb-4 text-chocolate-light" />
              <p className="text-lg font-bold text-chocolate-light">Belum ada berita.</p>
            </div>
          ) : (
            blogs.map((blog) => (
              <Card 
                key={blog.id} 
                onClick={() => setSelectedBlog(blog)} 
                className="p-0 overflow-hidden border-none shadow-xl shadow-chocolate/5 rounded-[2.5rem] bg-white flex flex-col cursor-pointer hover:scale-[1.02] transition-all group"
              >
                <div className="h-48 bg-orange-50 overflow-hidden">
                  <img src={blog.imageUrl || "https://picsum.photos/seed/donut/800/400"} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <Badge color="yellow">BERITA</Badge>
                    <span className="text-[10px] font-black text-chocolate-light uppercase tracking-widest">
                      {new Date(blog.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-chocolate line-clamp-2 leading-tight mb-3 group-hover:text-honey-dark transition-colors">{blog.title}</h4>
                  <p className="text-sm text-chocolate-light font-bold line-clamp-3 leading-relaxed mb-4">{blog.content}</p>
                  <div className="text-xs font-black text-honey-dark flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    BACA SELENGKAPNYA <ChevronRight size={14} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderKartu = () => (
    <div className="space-y-8 pb-28 flex flex-col items-center">
      <header className="text-center w-full px-2">
        <h2 className="text-2xl font-black text-chocolate">Kartu Member Digital</h2>
        <p className="text-xs text-chocolate-light font-bold">Tunjukkan kartu ini ke kasir saat bertransaksi</p>
      </header>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm aspect-[1.6/1] bg-gradient-to-br from-chocolate via-chocolate-dark to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ring-8 ring-honey/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-honey/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <img src="https://donatmaduindonesia.com/wp-content/uploads/2025/08/Logo-Website.svg" alt="Logo" className="h-10 w-auto brightness-0 invert" />
            <div className="text-right">
              <p className="text-[10px] font-black text-honey uppercase tracking-[0.2em]">Premium Member</p>
              <p className="text-[8px] text-white/50 font-medium">EST. {new Date(customer.memberSince || '').getFullYear()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black tracking-tight mb-1">{customer.name}</h3>
            <p className="text-sm font-mono text-white/70 tracking-widest">
              {customer.phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
              <p className="text-[8px] text-white/60 font-bold uppercase tracking-widest">Member ID</p>
              <p className="text-xs font-black font-mono">{customer.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-lg">
              <div className="w-full h-full bg-black rounded-xl opacity-20 flex items-center justify-center">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-sm space-y-4 px-2">
        <Card className="p-6 flex items-center gap-4 border-none shadow-sm bg-orange-50/50 rounded-3xl">
          <div className="w-12 h-12 bg-honey/20 rounded-2xl flex items-center justify-center text-honey-dark">
            <Info size={24} />
          </div>
          <div>
            <h4 className="font-bold text-chocolate text-sm">Cara Penggunaan</h4>
            <p className="text-[10px] text-chocolate-light mt-1 font-medium leading-relaxed">Kasir akan memindai atau mencatat nomor HP Anda untuk memproses promo spesial member.</p>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-8 pb-32 px-1">
      <header className="px-2">
        <h2 className="text-3xl font-black text-chocolate tracking-tight">Pusat Bantuan</h2>
        <p className="text-sm text-chocolate-light font-bold">Pertanyaan yang sering diajukan</p>
      </header>

      <div className="space-y-5">
        {faqs.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <MessageCircle size={64} className="mx-auto mb-4 text-chocolate-light" />
            <p className="text-lg font-bold text-chocolate-light">Belum ada FAQ.</p>
          </div>
        ) : (
          faqs.map((item) => (
            <Card key={item.id} className="p-6 border-none shadow-xl shadow-chocolate/5 bg-white rounded-[2rem]">
              <h4 className="font-black text-chocolate text-base mb-3 flex items-start gap-4">
                <div className="w-8 h-8 bg-honey/20 rounded-xl flex items-center justify-center text-honey-dark flex-shrink-0 mt-0.5">
                  <span className="text-xs">?</span>
                </div>
                {item.question}
              </h4>
              <p className="text-sm text-chocolate-light leading-relaxed pl-12 font-medium">{item.answer}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderProfil = () => (
    <div className="space-y-8 pb-28">
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <div className="w-28 h-28 bg-gradient-to-tr from-honey to-orange-400 rounded-full p-1 shadow-2xl mb-4">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-chocolate">
              <UserIcon size={56} />
            </div>
          </div>
          <div className="absolute bottom-6 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-2xl font-black text-chocolate">{customer.name}</h2>
        <p className="text-sm font-bold text-chocolate-light">{customer.phone}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-chocolate-light uppercase tracking-[0.2em] px-4">Informasi Akun</h3>
        <Card className="p-0 overflow-hidden border-none shadow-sm rounded-3xl">
          <div className="p-5 flex justify-between items-center border-b border-orange-50">
            <div className="flex items-center gap-4">
              <Clock size={20} className="text-chocolate-light" />
              <span className="text-xs font-bold text-chocolate">Bergabung Sejak</span>
            </div>
            <span className="text-xs font-bold text-chocolate-light">
              {customer.memberSince ? new Date(customer.memberSince).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={20} className="text-chocolate-light" />
              <span className="text-xs font-bold text-chocolate">Status Keanggotaan</span>
            </div>
            <Badge color="green" className="text-[10px]">AKTIF</Badge>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-chocolate-light uppercase tracking-[0.2em] px-4">Layanan</h3>
        <Card className="p-0 overflow-hidden border-none shadow-sm rounded-3xl">
          <button className="w-full p-5 flex justify-between items-center hover:bg-orange-50/50 transition-colors border-b border-orange-50 text-left">
            <div className="flex items-center gap-4">
              <ExternalLink size={20} className="text-chocolate-light" />
              <span className="text-xs font-bold text-chocolate">Website Donat Madu</span>
            </div>
            <ChevronRight size={18} className="text-chocolate-light" />
          </button>
          <button className="w-full p-5 flex justify-between items-center hover:bg-orange-50/50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <Info size={20} className="text-chocolate-light" />
              <span className="text-xs font-bold text-chocolate">Syarat & Ketentuan</span>
            </div>
            <ChevronRight size={18} className="text-chocolate-light" />
          </button>
        </Card>
      </div>

      <div className="pt-8 space-y-4">
        <Button variant="danger" onClick={onLogout} className="w-full py-4 rounded-3xl shadow-lg shadow-red-100">
          Keluar dari Akun
        </Button>
        <p className="text-center text-[10px] text-chocolate-light font-black uppercase tracking-widest opacity-40">Donat Madu Cihanjuang v2.1</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-white md:bg-orange-50/20">
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* ... existing sidebar ... */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-orange-100 p-6">
          <div className="mb-10 px-2">
            <img src="https://donatmaduindonesia.com/wp-content/uploads/2025/08/Logo-Website.svg" alt="Logo" className="h-12 w-auto mb-2" />
            <p className="text-[10px] font-black text-honey-dark uppercase tracking-[0.2em]">Cab. Gunung Batu</p>
          </div>
          
          <nav className="flex-grow space-y-2">
            <SidebarLink active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} label="Home" />
            <SidebarLink active={activeTab === 'promo'} onClick={() => setActiveTab('promo')} icon={<Ticket size={20} />} label="Promo" />
            <SidebarLink active={activeTab === 'kartu'} onClick={() => setActiveTab('kartu')} icon={<CreditCard size={20} />} label="Kartu Member" />
            <SidebarLink active={activeTab === 'berita'} onClick={() => { setActiveTab('berita'); setSelectedBlog(null); }} icon={<Newspaper size={20} />} label="Berita" />
            <SidebarLink active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} icon={<MessageCircle size={20} />} label="FAQ" />
          </nav>

          <div className="pt-6 border-t border-orange-50 space-y-4">
            <button 
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-sm rounded-2xl transition-colors ${activeTab === 'profil' ? 'bg-chocolate text-white' : 'text-chocolate-light hover:bg-orange-50'}`}
            >
              <UserIcon size={18} /> Profil Saya
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-2xl transition-colors"
            >
              <ExternalLink size={18} /> Keluar Akun
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-grow px-0 md:px-10 pb-32 md:pb-10">
          {renderHeader()}
          <div className="max-w-4xl mx-auto md:mx-0 px-4 pt-4 md:pt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'home' && renderHome()}
                {activeTab === 'promo' && renderPromo()}
                {activeTab === 'berita' && renderBerita()}
                {activeTab === 'kartu' && renderKartu()}
                {activeTab === 'faq' && renderFAQ()}
                {activeTab === 'profil' && renderProfil()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Redemption Icon */}
      <div className="fixed bottom-24 right-6 z-[60] md:bottom-10 md:right-10">
        <button 
          onClick={() => setShowRedemption(true)}
          className="relative w-16 h-16 bg-chocolate text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <QrCode size={32} />
          {claims.filter(c => c.status === 'claimed').length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {claims.filter(c => c.status === 'claimed').length}
            </span>
          )}
          <div className="absolute right-full mr-4 bg-chocolate text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
            Tukar Voucher
          </div>
        </button>
      </div>

      {/* Redemption Modal */}
      <AnimatePresence>
        {showRedemption && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRedemption(false)}
              className="absolute inset-0 bg-chocolate/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-white w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-orange-50 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-chocolate">Voucher Saya</h3>
                  <p className="text-xs text-chocolate-light font-bold">Tukarkan voucher Anda di outlet</p>
                </div>
                <button onClick={() => setShowRedemption(false)} className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-chocolate">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
                {claims.filter(c => c.status === 'claimed').length === 0 ? (
                  <div className="text-center py-20 opacity-50">
                    <Ticket size={64} className="mx-auto mb-4 text-chocolate-light" />
                    <p className="text-lg font-bold text-chocolate-light">Belum ada voucher aktif.</p>
                  </div>
                ) : (
                  claims.filter(c => c.status === 'claimed').map(claim => {
                    const promo = promos.find(p => p.id === claim.promoId);
                    return (
                      <Card key={claim.id} className="p-4 border-none shadow-md bg-orange-50/30 flex items-center gap-4 rounded-3xl">
                        <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 overflow-hidden">
                          {promo?.imageUrl ? (
                            <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-orange-200"><Ticket size={24} /></div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-chocolate text-sm line-clamp-1">{promo?.title || 'Promo'}</h4>
                          <p className="text-[10px] text-chocolate-light font-bold">Klaim: {new Date(claim.claimedAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        <Button 
                          onClick={() => setSelectedClaim(claim)}
                          className="px-4 py-2 rounded-xl text-[10px] font-black"
                        >
                          Tukar
                        </Button>
                      </Card>
                    );
                  })
                )}

                {/* History Section */}
                {claims.filter(c => c.status === 'used').length > 0 && (
                  <div className="pt-8">
                    <h4 className="text-[10px] font-black text-chocolate-light uppercase tracking-widest mb-4 px-2">Riwayat Penukaran</h4>
                    <div className="space-y-3 opacity-60">
                      {claims.filter(c => c.status === 'used').slice(0, 5).map(claim => {
                        const promo = promos.find(p => p.id === claim.promoId);
                        return (
                          <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <History size={16} className="text-gray-400" />
                              <div>
                                <p className="text-xs font-bold text-chocolate">{promo?.title}</p>
                                <p className="text-[8px] text-gray-400">Digunakan: {new Date(claim.usedAt || '').toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                            <Badge color="gray" className="text-[8px]">TERPAKAI</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClaim(null)}
              className="absolute inset-0 bg-chocolate/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl p-6 text-center"
            >
              <div className="mb-4">
                <h3 className="text-xl font-black text-chocolate mb-1">Tunjukkan QR Ini</h3>
                <p className="text-[10px] text-chocolate-light font-bold">Datang ke outlet Cab. Gunung Batu</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-[2rem] mb-6 flex items-center justify-center shadow-inner">
                <QRCodeSVG 
                  value={selectedClaim.id} 
                  size={160}
                  level="H"
                  includeMargin={false}
                  fgColor="#3d2b1f"
                />
              </div>

              <div className="space-y-3 text-left bg-orange-50/50 p-4 rounded-2xl mb-6">
                <p className="text-[9px] font-black text-chocolate-light uppercase tracking-widest mb-1">Tata Cara:</p>
                <ol className="text-[11px] font-bold text-chocolate space-y-1.5">
                  <li className="flex gap-2">
                    <span className="w-4 h-4 bg-chocolate text-white rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">1</span>
                    Datang ke outlet Donat Madu
                  </li>
                  <li className="flex gap-2">
                    <span className="w-4 h-4 bg-chocolate text-white rounded-full flex items-center justify-center flex-shrink-0 text-[9px]">2</span>
                    Tunjukkan QR ini ke kasir
                  </li>
                </ol>
              </div>

              <div className="flex flex-col gap-2">
                <Button className="w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2">
                  <Download size={16} /> Simpan QR
                </Button>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="w-full py-2 text-chocolate-light font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"></div>
        
        <div className="relative bg-white/80 backdrop-blur-xl border-t border-orange-50 px-6 py-4 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={24} />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'promo'} 
            onClick={() => setActiveTab('promo')} 
            icon={<Ticket size={24} />} 
            label="Promo" 
          />
          
          {/* Central Highlighted Button (Kartu) */}
          <div className="relative -mt-16 flex flex-col items-center">
            <button 
              onClick={() => setActiveTab('kartu')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                activeTab === 'kartu' 
                ? 'bg-gradient-to-tr from-chocolate to-chocolate-dark text-white scale-110 ring-4 ring-white' 
                : 'bg-gradient-to-tr from-blue-400 to-blue-600 text-white hover:scale-105'
              }`}
            >
              <CreditCard size={32} />
            </button>
            <p className={`text-[10px] font-black text-center mt-2 transition-colors duration-300 ${activeTab === 'kartu' ? 'text-chocolate' : 'text-chocolate-light'}`}>
              KARTU
            </p>
          </div>

          <NavButton 
            active={activeTab === 'berita'} 
            onClick={() => { setActiveTab('berita'); setSelectedBlog(null); }} 
            icon={<Newspaper size={24} />} 
            label="Berita" 
          />
          <NavButton 
            active={activeTab === 'faq'} 
            onClick={() => setActiveTab('faq')} 
            icon={<MessageCircle size={24} />} 
            label="FAQ" 
          />
        </div>
      </div>

      {/* Claim Confirmation Modal */}
      <AnimatePresence>
        {selectedPromo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPromo(null)}
              className="absolute inset-0 bg-chocolate/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="h-40 bg-orange-50 relative">
                {selectedPromo.imageUrl ? (
                  <img src={selectedPromo.imageUrl} alt={selectedPromo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-200"><Ticket size={48} /></div>
                )}
                <button 
                  onClick={() => setSelectedPromo(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-chocolate shadow-sm"
                >
                  <span className="text-xl font-bold">×</span>
                </button>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black text-chocolate leading-tight mb-4">{selectedPromo.title}</h3>
                <p className="text-sm text-chocolate-light font-medium leading-relaxed mb-8">
                  Apakah Anda yakin ingin mengklaim promo ini? Promo yang sudah diklaim akan muncul di daftar promo Anda dan dapat ditunjukkan ke kasir.
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => handleClaim(selectedPromo.id)}
                    disabled={isClaiming}
                    className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl ${isClaiming ? 'bg-gray-300 shadow-none' : 'shadow-honey/20'}`}
                  >
                    {isClaiming ? 'SEDANG MEMPROSES...' : 'Ya, Klaim Sekarang'}
                  </Button>
                  <button 
                    onClick={() => setSelectedPromo(null)}
                    className="w-full py-4 text-chocolate-light font-bold text-sm hover:text-chocolate transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlashSaleCard: React.FC<{ promo: Promo; onClaim: (p: Promo) => void; totalClaims: number }> = ({ promo, onClaim, totalClaims }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    if (!promo.endTime) return;
    const updateTimer = () => {
      const diff = new Date(promo.endTime!).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        setTimeLeft({
          h: Math.floor(diff / (1000 * 60 * 60)),
          m: Math.floor((diff / (1000 * 60)) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [promo.endTime]);

  const progress = promo.totalQuota && promo.totalQuota > 0 
    ? Math.min(100, (totalClaims / promo.totalQuota) * 100) 
    : 0;

  return (
    <Card className="p-0 overflow-hidden border-2 border-red-100 rounded-[2.5rem] shadow-xl shadow-red-50 relative group h-full flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <Badge color="red" className="animate-pulse flex items-center gap-1">
          <Clock size={10} /> FLASH SALE
        </Badge>
      </div>
      <div className="h-48 bg-orange-50 relative flex-shrink-0">
        {promo.imageUrl ? (
          <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-red-200"><Ticket size={48} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h4 className="font-black text-lg leading-tight line-clamp-1">{promo.title}</h4>
          <p className="text-[10px] font-medium opacity-90 line-clamp-1 mt-1">{promo.description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div className="space-y-4">
          {timeLeft ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-chocolate-light uppercase tracking-widest">Berakhir Dalam:</p>
              <div className="flex gap-1.5">
                {[
                  { val: timeLeft.h, label: 'j' },
                  { val: timeLeft.m, label: 'm' },
                  { val: timeLeft.s, label: 'd' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-1 rounded-md min-w-[24px] text-center">
                      {item.val.toString().padStart(2, '0')}
                    </div>
                    <span className="text-[8px] font-black text-red-500 uppercase mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Segera Berakhir</p>
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black text-chocolate-light uppercase tracking-widest">
              <span>Stok: {promo.totalQuota ? Math.max(0, promo.totalQuota - totalClaims) : 'Terbatas'}</span>
              <span>{Math.round(progress)}% Terjual</span>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
              />
            </div>
          </div>
        </div>
        <Button 
          onClick={() => onClaim(promo)} 
          disabled={promo.totalQuota ? totalClaims >= promo.totalQuota : false}
          className={`w-full py-3.5 rounded-2xl shadow-lg mt-2 ${
            promo.totalQuota && totalClaims >= promo.totalQuota 
            ? 'bg-gray-300 shadow-none cursor-not-allowed' 
            : 'shadow-red-100 bg-red-500 hover:bg-red-600'
          }`}
        >
          {promo.totalQuota && totalClaims >= promo.totalQuota ? 'STOK HABIS' : 'KLAIM SEKARANG'}
        </Button>
      </div>
    </Card>
  );
};

interface SidebarLinkProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
      active 
      ? 'bg-chocolate text-white shadow-lg shadow-chocolate/20 translate-x-1' 
      : 'text-chocolate-light hover:bg-orange-50 hover:text-chocolate'
    }`}
  >
    {icon}
    {label}
  </button>
);

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-chocolate scale-110' : 'text-chocolate-light hover:text-honey'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'translate-y-[-2px]' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black tracking-tighter uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
  </button>
);

export default CustomerView;
