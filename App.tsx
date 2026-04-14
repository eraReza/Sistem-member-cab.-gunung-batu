
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { StorageService } from './services/storageService';
import AdminCentral from './views/AdminCentral';
import CustomerView from './views/CustomerView';
import { LogIn, User as UserIcon, LogOut, Phone, ShieldCheck, ChevronRight, UserPlus } from 'lucide-react';
import { Button, Input, Card } from './components/UI';
import { motion, AnimatePresence } from 'motion/react';

const LOGO_URL = "https://donatmaduindonesia.com/wp-content/uploads/2025/08/Logo-Website.svg";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [error, setError] = useState('');

  const refreshSession = async () => {
    const sessionStr = localStorage.getItem('dm_current_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr) as User;
      const freshUser = await StorageService.getUserByPhone(sessionUser.phone);
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem('dm_current_session', JSON.stringify(freshUser));
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await StorageService.seedInitialData();
      await refreshSession();
      setLoading(false);
    };
    init();

    const subscription = StorageService.subscribeToUpdates(() => {
      refreshSession();
    });

    window.addEventListener('user-data-updated', refreshSession);
    return () => {
      window.removeEventListener('user-data-updated', refreshSession);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    try {
      const user = await StorageService.getUserByPhone(cleanPhone);

      if (!user) {
        setError('Nomor HP tidak terdaftar. Pastikan Anda sudah terdaftar sebagai member.');
        setLoading(false);
        return;
      }

      if (isStaffLogin && user.role !== UserRole.ADMIN_CENTRAL) {
        setError('Gunakan login Member.');
        setLoading(false);
        return;
      }

      if (!isStaffLogin && !user.isMember) {
        setError('Anda belum terdaftar sebagai member. Silakan hubungi kasir.');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      localStorage.setItem('dm_current_session', JSON.stringify(user));
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dm_current_session');
  };

  if (loading && !currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <img src={LOGO_URL} alt="Logo" className="h-20 w-auto" />
        <p className="text-chocolate font-bold animate-bounce">Menyiapkan Donat...</p>
      </div>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-white">
        <AnimatePresence mode="wait">
          <motion.div 
            key={isStaffLogin ? 'admin' : 'member'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-10">
              <img src={LOGO_URL} alt="Donat Madu Logo" className="h-28 w-auto mx-auto mb-6 drop-shadow-lg" />
              <h1 className="text-3xl font-black text-chocolate-dark">
                {isStaffLogin ? 'Portal Admin' : 'Member Card'}
              </h1>
              <p className="text-chocolate-light text-sm font-medium mt-2">
                {isStaffLogin ? 'Kelola promo dan member pusat' : 'Masuk untuk melihat promo eksklusif'}
              </p>
            </div>

            <Card className="shadow-xl border-t-4 border-t-honey">
              <form onSubmit={handleLogin} className="space-y-6">
                <Input label="Nomor Handphone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Contoh: 0812..." />
                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                <Button type="submit" className="w-full py-4" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk Sekarang'}
                </Button>
              </form>
              <div className="mt-8 pt-6 border-t border-orange-50 space-y-4 text-center">
                <button onClick={() => setIsStaffLogin(!isStaffLogin)} className="text-chocolate-light text-[10px] font-black uppercase tracking-widest hover:text-honey transition-colors">
                  {isStaffLogin ? 'Kembali ke Member' : 'Login sebagai Admin Pusat'}
                </button>
              </div>
            </Card>
            
            {!isStaffLogin && (
              <div className="mt-8 text-center bg-honey/10 p-4 rounded-2xl border border-honey/20">
                <p className="text-xs font-bold text-chocolate">Belum jadi member?</p>
                <p className="text-[10px] text-chocolate-light mt-1">Belanja minimal <span className="font-black text-honey-dark">Rp 80.000</span> di outlet untuk didaftarkan otomatis oleh kasir.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {currentUser.role === UserRole.ADMIN_CENTRAL && (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-50 shadow-sm h-20 flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <img src={LOGO_URL} alt="Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-black text-chocolate">{currentUser.name}</p>
                <p className="text-[9px] font-black text-honey-dark uppercase tracking-widest">ADMIN PUSAT</p>
              </div>
              <button onClick={handleLogout} className="p-2 bg-orange-50 rounded-full text-chocolate-light hover:text-red-500 transition-colors"><LogOut size={20} /></button>
            </div>
          </div>
        </nav>
      )}
      
      <main className={`${currentUser.role === UserRole.ADMIN_CENTRAL ? 'max-w-7xl mx-auto px-6 py-8' : ''}`}>
        {currentUser.role === UserRole.ADMIN_CENTRAL && <AdminCentral />}
        {currentUser.role === UserRole.CUSTOMER && <CustomerView customer={currentUser} onLogout={handleLogout} />}
      </main>
    </motion.div>
  );
};

export default App;
