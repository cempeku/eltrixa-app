
import React, { useState, useEffect } from 'react';
import { api, parseExcel } from '../services/dataService';
import { User, Role } from '../types';
import { UploadCloud, RefreshCw, Activity, Database, Users, CheckCircle2, FileSpreadsheet, Info, Trash2, X, HardDrive } from 'lucide-react';

export const Admin = () => {
  const [stats, setStats] = useState<{ officerCount: number, activeCount: number, users: User[], recentLogs: any[], rowCounts: any }>({ officerCount: 0, activeCount: 0, users: [], recentLogs: [], rowCounts: {} });
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'STATS' | 'LOGS' | 'DATABASE'>('STATS');
  const [showFormatGuide, setShowFormatGuide] = useState<string | null>(null);

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    setLoading(true);
    try {
        const s = await api.getStats(); 
        setStats(s); 
    } catch (e) {
        showMsg("Gagal sinkron database!", "error");
    } finally {
        setLoading(false);
    }
  };

  const showMsg = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files?.[0]) return;
    setLoading(true);
    try {
      const json = await parseExcel(e.target.files[0]);
      if (type === 'CUSTOMERS') await api.uploadCustomers(json);
      else if (type === 'ARREARS') await api.uploadArrears(json);
      else if (type === 'WHITELIST') await api.uploadWhitelist(json.map((r: any) => String(r.IDPEL || r.idpel)));
      else if (type === 'PROFILES') await api.uploadUsers(json.map((r: any) => ({ 
          username: String(r.USERNAME || r.username).toUpperCase(), 
          name: String(r.NAMA || r.nama || r.USERNAME || r.username), 
          role: (String(r.ROLE || r.role).toUpperCase() === 'ADMIN') ? Role.ADMIN : Role.OFFICER,
          deviceId: null
      })));
      
      showMsg("Data disinkronkan ke Online Database!", "success");
      refreshStats();
    } catch (err: any) { showMsg(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleReset = async (type: string) => {
    if (!confirm(`Hapus permanen data ${type} di server online?`)) return;
    if (type === 'Pelanggan') await api.clearAllCustomers();
    else if (type === 'Tunggakan') await api.clearAllArrears();
    else if (type === 'Whitelist') await api.clearAllWhitelist();
    else if (type === 'Entry TRX') await api.clearAllEntries();
    showMsg(`Data ${type} di server telah dibersihkan.`, 'success');
    refreshStats();
  };

  const formatGuides: Record<string, string[]> = {
    'CUSTOMERS': ['IDPEL', 'NO_METER', 'KDDK', 'HARI_BACA', 'NAMA_PETUGAS', 'NAMA PELANGGAN', 'ALAMAT', 'TARIF', 'DAYA', 'GARDU', 'NO_TIANG', 'JENIS_LAYANAN', 'STATUS'],
    'ARREARS': ['PETUGAS', 'IDPEL', 'HARI', 'NAMA', 'ALAMAT', 'TARIF', 'DAYA', 'RPTAG'],
    'WHITELIST': ['IDPEL'],
    'PROFILES': ['USERNAME', 'NAMA', 'ROLE']
  };

  return (
    <div className="px-8 space-y-8 animate-fade-in pb-32">
      {msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-[2rem] ${msg.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'} text-white shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3`}>
            <CheckCircle2 size={18}/>
            <span>{msg.text}</span>
        </div>
      )}

      {/* Header Mode Online */}
      <div className="premium-glass p-8 rounded-[2.5rem] flex justify-between items-center border-indigo-500/30 bg-indigo-500/5">
         <div className="flex items-center space-x-5">
            <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.8)]"></div>
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Panel Kontrol</h2>
                <p className="text-[9px] font-black text-green-400 uppercase tracking-[0.3em]">Mode Online: Cloud Database</p>
            </div>
         </div>
         <button onClick={refreshStats} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:rotate-180 duration-700">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
         </button>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
          {['STATS', 'LOGS', 'DATABASE'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)} 
              className={`flex-1 py-3.5 text-[10px] font-black rounded-[1.5rem] transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}
            >
              {tab === 'STATS' ? 'Data' : tab === 'LOGS' ? 'Log' : 'Mesin'}
            </button>
          ))}
      </div>

      {activeTab === 'STATS' && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <div className="premium-glass p-6 rounded-[2.5rem] border-white/5">
                    <Users className="text-indigo-400 mb-3" size={24}/>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Operator Terdaftar</p>
                    <p className="text-3xl font-extrabold text-white">{stats.officerCount}</p>
                </div>
                <div className="premium-glass p-6 rounded-[2.5rem] border-white/5">
                    <Activity className="text-green-400 mb-3" size={24}/>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sesi Aktif</p>
                    <p className="text-3xl font-extrabold text-white">{stats.activeCount}</p>
                </div>
            </div>
            
            <div className="premium-glass rounded-[2.5rem] overflow-hidden">
                <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                    <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Manajemen Akun Cloud</span>
                </div>
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto no-scrollbar">
                    {stats.users.map(u => (
                        <div key={u.username} className="p-6 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-extrabold text-sm text-white uppercase">{u.username}</span>
                                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{u.role}</span>
                            </div>
                            <button onClick={() => { api.updateUserDevice(u.username, null).then(refreshStats) }} className="text-[8px] bg-white/5 text-slate-500 px-3 py-2 rounded-xl border border-white/10 font-black uppercase">Riset Device</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'DATABASE' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] p-8 flex items-start space-x-4">
               <Database size={24} className="text-indigo-400 shrink-0"/>
               <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                 Data yang Bapak upload di sini akan langsung disinkronkan ke server Cloud Supabase dan dapat diakses oleh seluruh petugas secara real-time.
               </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <UploadBtn label="Master Pelanggan Online" rowCount={stats.rowCounts?.customers || 0} onInfo={() => setShowFormatGuide('CUSTOMERS')} onChange={(e:any) => handleFileUpload(e, 'CUSTOMERS')} onReset={() => handleReset('Pelanggan')} />
                <UploadBtn label="Master Tunggakan Online" rowCount={stats.rowCounts?.arrears || 0} onInfo={() => setShowFormatGuide('ARREARS')} onChange={(e:any) => handleFileUpload(e, 'ARREARS')} onReset={() => handleReset('Tunggakan')} />
                <UploadBtn label="Whitelist PLN Mobile" rowCount={stats.rowCounts?.whitelist || 0} onInfo={() => setShowFormatGuide('WHITELIST')} onChange={(e:any) => handleFileUpload(e, 'WHITELIST')} onReset={() => handleReset('Whitelist')} />
                <UploadBtn label="Sync User Profiles" rowCount={stats.users.length} onInfo={() => setShowFormatGuide('PROFILES')} onChange={(e:any) => handleFileUpload(e, 'PROFILES')} />
            </div>
            
            <button onClick={() => handleReset('Entry TRX')} className="w-full py-5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-[2rem] border border-red-500/20 uppercase tracking-widest">
                Bersihkan {stats.rowCounts?.entries || 0} Log Transaksi Server
            </button>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="premium-glass rounded-[2.5rem] overflow-hidden animate-fade-in">
            <div className="p-6 bg-white/[0.02] border-b border-white/5">
                <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Real-time Entry Logs</span>
            </div>
            <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto no-scrollbar">
                {stats.recentLogs.length > 0 ? stats.recentLogs.map((log, i) => (
                    <div key={i} className="p-6">
                        <div className="flex justify-between font-black text-sm mb-2">
                            <span className="text-white">{log.idpel}</span>
                            <span className="text-slate-600 font-mono text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Petugas: {log.petugas} • Status: {log.status}</p>
                    </div>
                )) : (
                    <div className="p-20 text-center text-slate-700 font-black text-[10px] uppercase tracking-[0.5em]">Log Server Kosong</div>
                )}
            </div>
        </div>
      )}

      {/* Format Modal */}
      {showFormatGuide && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8">
           <div className="premium-glass w-full max-w-sm rounded-[3rem] overflow-hidden border-white/10 shadow-2xl animate-fade-in">
              <div className="p-8 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Header Excel</h3>
                 <button onClick={() => setShowFormatGuide(null)} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex flex-wrap gap-2">
                    {formatGuides[showFormatGuide].map(h => (
                      <span key={h} className="px-3 py-2 bg-slate-900 border border-white/5 rounded-xl text-[9px] font-black text-indigo-400 tracking-widest">{h}</span>
                    ))}
                 </div>
                 <button onClick={() => setShowFormatGuide(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">MENGERTI</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const UploadBtn = ({ label, rowCount, onChange, onInfo, onReset }: any) => (
    <div className="flex items-center p-6 premium-glass border-white/5 rounded-[2.5rem] transition-all">
        <label className="flex-1 cursor-pointer">
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{label}</span>
            <p className={`text-[9px] font-black uppercase mt-1 ${rowCount > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                {rowCount > 0 ? `${rowCount.toLocaleString()} BARIS SERVER` : 'KOSONG'}
            </p>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onChange} />
        </label>
        <div className="flex items-center space-x-2">
           {onReset && (
             <button onClick={onReset} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 size={18} />
             </button>
           )}
           <button type="button" onClick={onInfo} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-indigo-400 transition-colors">
              <Info size={18} />
           </button>
           <label className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
              <UploadCloud size={20}/>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onChange} />
           </label>
        </div>
    </div>
);
