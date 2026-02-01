import React, { useState, useEffect } from 'react';
import { api, parseExcel } from '../services/dataService';
import { User, Role } from '../types';
import { UploadCloud, RefreshCw, Activity, Database, Users, CheckCircle2, Info, Trash2, X, ShieldCheck, Smartphone, RotateCcw, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Admin = () => {
  const [stats, setStats] = useState<{ officerCount: number, activeCount: number, users: User[], recentLogs: any[], rowCounts: any }>({ officerCount: 0, activeCount: 0, users: [], recentLogs: [], rowCounts: {} });
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'STATS' | 'LOGS' | 'DATABASE'>('STATS');
  const [showFormatGuide, setShowFormatGuide] = useState<string | null>(null);

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    setLoading(true);
    try {
        const s = await api.getStats(); 
        if (s) setStats(s); 
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

  const handleResetDevice = async (username: string) => {
    if (!confirm(`Riset HP ${username}?`)) return;
    setLoading(true);
    try {
      await api.updateUserDevice(username, null);
      showMsg("Device telah diriset!", 'success');
      refreshStats();
    } catch (err) {
      showMsg("Gagal meriset device", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setUploadProgress(null);
    try {
      const json = await parseExcel(file);
      const totalRows = json.length;
      setUploadProgress({ current: 0, total: totalRows });
      const cb = (p: number) => setUploadProgress({ current: p, total: totalRows });

      if (type === 'CUSTOMERS') await api.uploadCustomers(json, cb);
      else if (type === 'ARREARS') await api.uploadArrears(json, cb);
      else if (type === 'SETTLEMENTS') await api.uploadSettlements(json.map((r:any) => String(r.IDPEL || r.idpel)), cb);
      else if (type === 'WHITELIST') await api.uploadWhitelist(json.map((r: any) => String(r.IDPEL || r.idpel)), cb);
      else if (type === 'PROFILES') await api.uploadUsers(json);
      
      showMsg("Sinkronisasi Berhasil!", "success");
      refreshStats();
    } catch (err: any) { 
      showMsg(err.message, 'error'); 
    } finally { 
      setLoading(false); 
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleExportEntryLogs = async () => {
    setLoading(true);
    try {
      const logs = await api.getAllEntryLogs();
      if (logs.length === 0) {
        showMsg("Tidak ada data untuk diekspor.", "warning");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(logs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Entry");
      XLSX.writeFile(wb, `Hasil_Entry_PLN_Mobile_${new Date().toISOString().split('T')[0]}.xlsx`);
      showMsg("Berhasil Ekspor Excel", "success");
    } catch (err) {
      showMsg("Gagal ekspor data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (type: string) => {
    if (!confirm(`Bersihkan data ${type} dari server?`)) return;
    setLoading(true);
    try {
        if (type === 'Pelanggan') await api.clearAllCustomers();
        else if (type === 'Tunggakan') await api.clearAllArrears();
        else if (type === 'Whitelist') await api.clearAllWhitelist();
        else if (type === 'Entry TRX') await api.clearAllEntries();
        showMsg(`Data ${type} telah dihapus.`, 'success');
        refreshStats();
    } catch (e) {
        showMsg("Gagal menghapus data", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="px-8 space-y-8 animate-fade-in pb-32">
      {msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-[2rem] ${msg.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'} text-white shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3`}>
            <CheckCircle2 size={18}/>
            <span>{msg.text}</span>
        </div>
      )}

      {uploadProgress && (
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10 animate-fade-in">
           <div className="premium-glass p-8 rounded-[3rem] border-indigo-500/30 w-full max-w-sm">
              <Loader2 className="animate-spin text-indigo-400 mx-auto mb-6" size={40} />
              <p className="text-white font-black uppercase tracking-widest text-center text-xs mb-4">MENGIRIM KE CLOUD</p>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-2">
                 <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-center font-bold text-indigo-400 uppercase tracking-widest">
                {uploadProgress.current.toLocaleString()} / {uploadProgress.total.toLocaleString()} BARIS
              </p>
           </div>
        </div>
      )}

      <div className="premium-glass p-8 rounded-[2.5rem] flex justify-between items-center bg-indigo-500/5">
         <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Panel Kontrol</h2>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Master Data Management</p>
         </div>
         <button onClick={refreshStats} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <RefreshCw size={20} className={loading && !uploadProgress ? 'animate-spin' : ''}/>
         </button>
      </div>

      <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
          {['STATS', 'LOGS', 'DATABASE'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-[9px] font-black rounded-[1.5rem] transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>
              {tab === 'STATS' ? 'Sesi' : tab === 'LOGS' ? 'History' : 'Data'}
            </button>
          ))}
      </div>

      {activeTab === 'STATS' && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <div className="premium-glass p-6 rounded-[2.5rem] bg-indigo-500/5">
                    <Users className="text-indigo-400 mb-2" size={20}/>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Total Petugas</p>
                    <p className="text-2xl font-extrabold text-white">{stats.officerCount}</p>
                </div>
                <div className="premium-glass p-6 rounded-[2.5rem] bg-green-500/5">
                    <Activity className="text-green-400 mb-2" size={20}/>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Sesi Aktif</p>
                    <p className="text-2xl font-extrabold text-white">{stats.activeCount}</p>
                </div>
            </div>
            
            <div className="premium-glass rounded-[2.5rem] overflow-hidden border-white/5">
                <div className="p-6 bg-white/[0.02] border-b border-white/5">
                    <span className="font-black text-[9px] uppercase text-slate-400 tracking-widest">Manajemen Kunci Perangkat</span>
                </div>
                <div className="divide-y divide-white/5">
                    {stats.users.map(u => (
                        <div key={u.username} className="p-5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-extrabold text-sm text-white uppercase">{u.username}</span>
                                <span className="text-[8px] text-indigo-400 uppercase font-black">{u.name}</span>
                            </div>
                            {/* Use camelCase deviceId from User interface instead of snake_case device_id from database */}
                            {u.deviceId && (
                                <button onClick={() => handleResetDevice(u.username)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">Riset HP</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'DATABASE' && (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
                <UploadBtn label="Update Data Master (175rb Baris)" rowCount={stats.rowCounts?.customers || 0} onChange={(e:any) => handleFileUpload(e, 'CUSTOMERS')} onReset={() => handleReset('Pelanggan')} />
                <UploadBtn label="Update Data Tunggakan" rowCount={stats.rowCounts?.arrears || 0} onChange={(e:any) => handleFileUpload(e, 'ARREARS')} onReset={() => handleReset('Tunggakan')} />
                <UploadBtn label="Hapus Pelanggan Lunas (Input IDPEL)" rowCount={0} onChange={(e:any) => handleFileUpload(e, 'SETTLEMENTS')} />
                <UploadBtn label="Update Whitelist PLN Mobile" rowCount={stats.rowCounts?.whitelist || 0} onChange={(e:any) => handleFileUpload(e, 'WHITELIST')} onReset={() => handleReset('Whitelist')} />
            </div>
            
            <div className="pt-4 space-y-3">
               <button onClick={handleExportEntryLogs} className="w-full py-5 bg-green-500/10 text-green-400 text-[10px] font-black rounded-[2rem] border border-green-500/20 uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-500 hover:text-white transition-all shadow-xl active:scale-95">
                   <Download size={18} /> Ekspor Hasil Entry TRX (.XLSX)
               </button>
               <button onClick={() => handleReset('Entry TRX')} className="w-full py-4 bg-red-500/5 text-red-400/50 text-[9px] font-black rounded-[2rem] border border-red-500/10 uppercase tracking-widest">
                   Hapus History Entry Server
               </button>
            </div>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="premium-glass rounded-[2.5rem] overflow-hidden animate-fade-in border-white/5">
            <div className="p-6 bg-white/[0.02] border-b border-white/5">
                <span className="font-black text-[9px] uppercase text-slate-400 tracking-widest">Log Aktivitas Terbaru</span>
            </div>
            <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto no-scrollbar">
                {stats.recentLogs.map((log, i) => (
                    <div key={i} className="p-5 flex justify-between bg-white/[0.01]">
                        <div>
                          <p className="text-white font-black text-xs tracking-wider">{log.idpel}</p>
                          <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">{log.petugas} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-green-400 font-black text-[9px] uppercase tracking-widest">SUCCESS</span>
                           <span className="text-[7px] text-slate-600 font-mono mt-0.5 uppercase">Saved to cloud</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

const UploadBtn = ({ label, rowCount, onChange, onReset }: any) => (
    <div className="flex items-center p-6 premium-glass border-white/5 rounded-[2.5rem] hover:bg-white/[0.03] transition-colors">
        <label className="flex-1 cursor-pointer">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
            <p className="text-[8px] font-black text-slate-600 uppercase mt-1">
                {rowCount > 0 ? `${rowCount.toLocaleString()} DATA TERSIMPAN` : 'READY TO SYNC'}
            </p>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onChange} />
        </label>
        <div className="flex items-center space-x-2">
           {onReset && <button onClick={onReset} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>}
           <label className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95">
              <UploadCloud size={18}/>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onChange} />
           </label>
        </div>
    </div>
);
