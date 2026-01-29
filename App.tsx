import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Search } from './components/Search';
import { Arrears } from './components/Arrears';
import { Entry } from './components/Entry';
import { Admin } from './components/Admin';
import { User, Role } from './types';
import { MOTIVATIONAL_QUOTES } from './constants';
import { isConfigured } from './services/supabaseClient';
import { RefreshCw, Globe } from 'lucide-react';

const ECGLine = () => (
  <svg className="w-[200%] h-24 text-cyan-500/15 animate-ecg-scroll" viewBox="0 0 1000 100" preserveAspectRatio="none">
    <path 
      d="M0,50 L100,50 L120,50 L130,20 L140,80 L150,50 L170,50 L200,50 L300,50 L320,50 L330,10 L340,90 L350,50 L370,50 L400,50 L500,50 L520,50 L530,20 L540,80 L550,50 L570,50 L600,50 L700,50 L720,50 L730,10 L740,90 L750,50 L770,50 L800,50 L900,50 L920,50 L930,20 L940,80 L950,50 L970,50 L1000,50" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5"
    />
  </svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('search');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [configReady, setConfigReady] = useState(isConfigured());

  useEffect(() => {
    const savedUser = sessionStorage.getItem('eltrixa_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      const hour = new Date().getHours();
      let greeting = 'Selamat Pagi';
      if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
      else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
      else if (hour >= 18) greeting = 'Selamat Malam';
      setNotification(`${greeting}, ${user.name}!`);
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('eltrixa_user', JSON.stringify(u));
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setNotification(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    setTimeout(() => {
      sessionStorage.removeItem('eltrixa_user');
      setUser(null);
      setNotification(null);
      setActiveMenu('search');
    }, 2000);
  };

  if (!configReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden hexagon-grid text-white">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] animate-pulse"></div>
        <div className="relative z-10 w-full max-w-lg animate-fade-in">
          <div className="premium-glass p-10 rounded-[3rem] border-white/5 text-center space-y-8">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(79,70,229,0.2)]">
              <Globe size={48} className="text-indigo-400" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-black uppercase tracking-widest italic">Ready for Cloud?</h1>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase max-w-xs mx-auto">
                Bapak akan menghubungkan ELTRIXA ke Cloudflare & Supabase.
              </p>
            </div>

            <div className="space-y-4 text-left">
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center space-x-3">
                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">1</div>
                     <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">Siapkan SQL Script di Supabase</p>
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">2</div>
                     <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">Deploy ke Cloudflare Pages</p>
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">3</div>
                     <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">Input API URL & Key di Cloudflare</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all"
              >
                <RefreshCw size={18} />
                <span>PERIKSA KONEKSI CLOUD</span>
              </button>
            </div>

            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] pt-4">
              ELTRIXA SYSTEM CORE • V1.3.1 • PRO-GRADE
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="relative min-h-screen bg-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 hexagon-grid">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-indigo-600/10 rounded-full blur-[140px] animate-heartbeat"></div>
        <div className="absolute top-[15%] w-full opacity-30 ecg-line"><ECGLine /></div>
        <div className="absolute bottom-[15%] w-full opacity-20 ecg-line rotate-180"><ECGLine /></div>
      </div>

      <div className="relative z-10">
        <Layout 
          user={user} 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          loading={loading}
          onLogout={() => setShowLogoutModal(true)}
          notification={notification}
        >
          {activeMenu === 'search' && <Search user={user} setLoading={setLoading} />}
          {activeMenu === 'arrears' && <Arrears user={user} setLoading={setLoading} />}
          {activeMenu === 'entry' && <Entry user={user} setLoading={setLoading} />}
          {activeMenu === 'admin' && (user.role === Role.ADMIN ? <Admin /> : <div className="p-10 text-center font-bold text-red-400">Akses Ditolak</div>)}

          {showLogoutModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
              <div className="premium-glass rounded-[2.5rem] w-full max-w-sm overflow-hidden border border-white/10">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl animate-bounce">⚡</span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Selesai Bertugas?</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Pastikan HP dalam kondisi terisi daya untuk tugas esok hari.</p>
                </div>
                <div className="p-6 bg-white/5 flex gap-3">
                  <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition">Batal</button>
                  <button onClick={confirmLogout} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/40 active:scale-95 transition">Ya, Keluar</button>
                </div>
              </div>
            </div>
          )}
        </Layout>
      </div>
    </div>
  );
};

export default App;
