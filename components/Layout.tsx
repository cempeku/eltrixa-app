
import React, { useState } from 'react';
import { User, Role } from '../types';
import { Logo } from './Logo';
import { MENUS } from '../constants';
import { isConfigured } from '../services/supabaseClient';
import { LogOut, Loader2, Bell, Menu, X, ChevronRight, Cloud, HardDrive } from 'lucide-react';

interface LayoutProps {
  user: User;
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  loading: boolean;
  onLogout: () => void;
  notification: string | null;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, activeMenu, setActiveMenu, loading, onLogout, notification, children 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const online = isConfigured();

  const handleMenuClick = (id: string) => {
    setActiveMenu(id);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col max-w-4xl mx-auto relative overflow-x-hidden md:px-10">
      
      {loading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xl transition-all duration-500">
          <div className="relative">
             <div className="absolute inset-0 bg-cyan-500/20 blur-[40px] rounded-full animate-glow"></div>
             <Loader2 className="animate-spin text-cyan-400 relative z-10" size={56} />
          </div>
          <p className="mt-6 font-bold text-[10px] tracking-[0.4em] uppercase text-cyan-400/80">Memproses Data...</p>
        </div>
      )}

      {notification && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-md pointer-events-none animate-fade-in">
          <div className="premium-glass px-6 py-4 rounded-[2rem] border border-cyan-500/20 shadow-2xl flex items-center space-x-4">
             <div className="w-10 h-10 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-xl shrink-0">
               <Bell size={18} className="text-cyan-400" />
             </div>
             <p className="font-semibold text-slate-200 text-xs leading-tight tracking-wide">{notification}</p>
          </div>
        </div>
      )}

      <header className="px-6 md:px-0 pt-20 pb-8 sticky top-0 z-[100] flex justify-between items-center transition-all">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-transparent pointer-events-none -z-10"></div>
        <Logo size="sm" white />
        
        <div className="flex items-center space-x-3">
          <div className={`hidden md:flex items-center px-4 py-2 rounded-xl border ${online ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
            {online ? <Cloud size={14} className="mr-2" /> : <HardDrive size={14} className="mr-2" />}
            <span className="text-[8px] font-black uppercase tracking-widest">{online ? 'Cloud Mode' : 'Local Mode'}</span>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center space-x-3 bg-white/5 p-1.5 pr-5 rounded-full border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95 group"
          >
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                <Menu size={18} className="text-white group-hover:rotate-180 transition-transform duration-500" />
             </div>
             <span className="font-black text-[10px] uppercase tracking-[0.2em] text-white">MENU</span>
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[200] transition-all duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
         <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)}></div>
         
         <div className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-950 border-l border-white/10 p-8 md:p-12 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-12 pt-6">
               <div className="flex flex-col">
                  <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Status Login:</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{user.username}</p>
                  <div className={`flex items-center mt-2 px-3 py-1 rounded-lg border w-fit ${online ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                    {online ? <Cloud size={10} className="mr-2" /> : <HardDrive size={10} className="mr-2" />}
                    <span className="text-[7px] font-black uppercase">{online ? 'CONNECTED TO CLOUD' : 'BROWSER STORAGE'}</span>
                  </div>
               </div>
               <button onClick={() => setIsMenuOpen(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  <X size={24} />
               </button>
            </div>

            <nav className="space-y-4">
               {MENUS.map(menu => {
                  if (menu.id === 'admin' && user.role !== Role.ADMIN) return null;
                  const Icon = menu.icon;
                  const isActive = activeMenu === menu.id;
                  
                  return (
                     <button
                        key={menu.id}
                        onClick={() => handleMenuClick(menu.id)}
                        className={`w-full p-5 rounded-[1.8rem] flex items-center justify-between transition-all group ${isActive ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]'}`}
                     >
                        <div className="flex items-center space-x-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/50' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                              <Icon size={22} />
                           </div>
                           <div className="text-left">
                              <span className={`block font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-cyan-400' : 'text-slate-200'}`}>{menu.label}</span>
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Buka Layanan</span>
                           </div>
                        </div>
                        <ChevronRight size={16} className={`${isActive ? 'text-cyan-400' : 'text-slate-700'}`} />
                     </button>
                  );
               })}

               <div className="pt-8 mt-8 border-t border-white/5">
                  <button 
                    onClick={() => { setIsMenuOpen(false); onLogout(); }}
                    className="w-full p-5 rounded-[1.8rem] bg-red-500/5 border border-red-500/10 flex items-center space-x-5 group hover:bg-red-500 transition-all"
                  >
                     <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-white group-hover:text-red-500 transition-all">
                        <LogOut size={22} />
                     </div>
                     <div className="text-left">
                        <span className="block font-black text-[11px] uppercase tracking-widest text-red-500 group-hover:text-white">Keluar Sistem</span>
                        <span className="text-[8px] text-red-500/50 font-bold uppercase tracking-tight group-hover:text-white/50">Akhiri Sesi Bertugas</span>
                     </div>
                  </button>
               </div>
            </nav>
         </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pt-4 px-6 md:px-0">
        {children}
      </main>
    </div>
  );
};
