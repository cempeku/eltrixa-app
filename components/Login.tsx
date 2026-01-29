
import React, { useState } from 'react';
import { getDeviceId } from '../services/dataService';
import { Logo } from './Logo';
import { User, Role } from '../types';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldAlert, RefreshCw, Info } from 'lucide-react';

const ECGLine = () => (
  <svg className="w-[200%] h-24 text-cyan-500/10 animate-ecg-scroll" viewBox="0 0 1000 100" preserveAspectRatio="none">
    <path 
      d="M0,50 L100,50 L120,50 L130,20 L140,80 L150,50 L170,50 L200,50 L300,50 L320,50 L330,10 L340,90 L350,50 L370,50 L400,50 L500,50 L520,50 L530,20 L540,80 L550,50 L570,50 L600,50 L700,50 L720,50 L730,10 L740,90 L750,50 L770,50 L800,50 L900,50 L920,50 L930,20 L940,80 L950,50 L970,50 L1000,50" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    />
  </svg>
);

export const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const { api } = await import('../services/dataService');
        const user = await api.login(username, password);

        if (user) {
            const currentDeviceId = getDeviceId();
            if (user.deviceId && user.deviceId !== currentDeviceId) {
              setError('AKUN INI TERKUNCI DI HP LAIN (RISET DI PANEL KONTROL)');
              setLoading(false);
              return;
            }
            if (!user.deviceId) {
              await api.updateUserDevice(user.username, currentDeviceId);
              user.deviceId = currentDeviceId;
            }
            onLogin(user);
        }
    } catch (err: any) {
        setError(err.message || 'Login Gagal.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950 hexagon-grid">
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-indigo-600/5 rounded-full blur-[120px] animate-heartbeat"></div>
        <div className="absolute top-[10%] w-full opacity-30 ecg-line">
          <ECGLine />
        </div>
        <div className="absolute bottom-[10%] w-full opacity-20 ecg-line rotate-180">
          <ECGLine />
        </div>
        
        {/* Floating Hexagon Decorations */}
        <div className="absolute top-[15%] left-[-10%] opacity-10 animate-float">
           <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
             <path d="M100 20 L169.3 60 L169.3 140 L100 180 L30.7 140 L30.7 60 Z" stroke="#22d3ee" strokeWidth="2" />
           </svg>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md animate-fade-in transition-all">
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center">
          <Logo size="lg" white />
        </div>
        
        {/* Login Form Container */}
        <div className="premium-glass p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full border border-indigo-500/20 backdrop-blur-2xl bg-indigo-950/10">
          <h2 className="text-lg md:text-xl font-black text-center text-white mb-8 tracking-[0.3em] uppercase">Masuk Sistem</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 text-[10px] rounded-2xl flex items-center font-black animate-shake uppercase tracking-widest">
               <ShieldAlert className="mr-3 shrink-0" size={18} /> 
               <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition" />
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-white/5 focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 font-bold uppercase text-sm" 
                placeholder="USERNAME" 
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-900/50 border border-white/5 focus:border-indigo-500 text-white outline-none transition-all placeholder:text-slate-600 font-bold text-sm" 
                placeholder="PASSWORD" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl shadow-indigo-900/40 active:scale-95 transition-all flex items-center justify-center uppercase tracking-[0.2em] text-[11px]"
            >
              {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : "AUTHENTICATION"}
            </button>
          </form>
        </div>
        
        {/* Footer Credit */}
        <div className="mt-12 flex flex-col items-center space-y-2 opacity-50">
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">MADE BY INUNG</p>
        </div>
      </div>
    </div>
  );
};