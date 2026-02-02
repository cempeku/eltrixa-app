import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Search } from './components/Search';
import { Arrears } from './components/Arrears';
import { Entry } from './components/Entry';
import { Admin } from './components/Admin';
import { User, Role } from './types';
import { MOTIVATIONAL_QUOTES } from './constants';

const ECGLine = () => (
  <svg className="w-[200%] h-24 text-cyan-500/10 animate-ecg-scroll" viewBox="0 0 1000 100" preserveAspectRatio="none">
    <path 
      d="M0,50 L100,50 L120,50 L130,20 L140,80 L150,50 L170,50 L200,50 L300,50 L320,50 L330,10 L340,90 L350,50 L370,50 L400,50 L500,50 L520,50 L530,20 L540,80 L550,50 L570,50 L600,50 L700,50 L720,50 L730,10 L740,90 L750,50 L770,50 L800,50 L900,50 L920,50 L930,20 L940,80 L950,50 L970,50 L1000,50" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5"
    />
  </svg>
);

const BackgroundLogo = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none overflow-hidden select-none">
    <svg 
      width="450" 
      height="450" 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="animate-pulse-soft text-cyan-500/30"
    >
      {/* Hexagon Frame - Very light stroke */}
      <path 
        d="M100 15 L173.6 57.5 L173.6 142.5 L100 185 L26.4 142.5 L26.4 57.5 Z" 
        stroke="currentColor" 
        strokeWidth="1.2" 
      />
      {/* Abstract Energy Icon (Lightning-like but rhythmic/abstract) */}
      <path 
        d="M110 30 L85 100 H115 L90 170" 
        stroke="currentColor" 
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {/* Modern Identity Marks */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.5">
        <path d="M60 70 H85 M60 100 H80 M60 130 H85 M60 70 V130" strokeLinecap="round" />
        <path d="M120 70 L145 130 M145 70 L120 130" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('search');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('eltrixa_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('eltrixa_user');
      }
    }
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
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setNotification(quote);
    setTimeout(() => {
      sessionStorage.removeItem('eltrixa_user');
      setUser(null);
      setNotification(null);
      setActiveMenu('search');
    }, 2000);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background Layer - Strictly isolated with z-0 and pointer-events-none */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 hexagon-grid">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-indigo-600/10 rounded-full blur-[140px] animate-heartbeat"></div>
        <BackgroundLogo />
        <div className="absolute top-[15%] w-full opacity-20 ecg-line"><ECGLine /></div>
        <div className="absolute bottom-[15%] w-full opacity-15 ecg-line rotate-180"><ECGLine /></div>
      </div>

      {/* Content Layer - Foreground logic stays here at z-10 */}
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
          {activeMenu === 'admin' && (user.role === Role.ADMIN ? <Admin /> : <div className="p-10 text-center font-bold text-red-400 uppercase tracking-widest text-[10px]">Akses Ditolak: Khusus Administrator</div>)}

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

