
import React, { useState, useEffect } from 'react';
import { User, EntryLog } from '../types';
import { api } from '../services/dataService';
import { playSound } from '../services/soundService';
import { AlertCircle, CheckCircle, Save, FileText, XCircle, Clock, CalendarOff, SearchCheck } from 'lucide-react';

interface EntryProps {
  user: User;
  setLoading: (l: boolean) => void;
}

interface SessionResult {
    total: number;
    success: number;
    failed: number;
    failedList: {id: string, reason: string}[];
    timestamp: string;
}

export const Entry: React.FC<EntryProps> = ({ user, setLoading }) => {
  const [inputText, setInputText] = useState('');
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
     const checkLock = () => {
         const now = new Date();
         const date = now.getDate();
         const hour = now.getHours();
         if (date >= 28) {
             if (date === 28 && hour >= 20) return true;
             if (date > 28) return true;
         }
         if (date <= 2) {
             if (date === 1) return true;
             if (date === 2 && hour < 10) return true;
         }
         return false;
     };
     setIsLocked(checkLock());
  }, []);

  const validateAndSubmit = async () => {
    setLoading(true);
    setSessionResult(null);
    playSound('loading');

    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) { setLoading(false); return; }
    if (lines.length > 75) { alert('Maksimal 75 IDPEL sekali entry.'); setLoading(false); return; }

    try {
      const failedList: {id: string, reason: string}[] = [];
      const validIdsAfterPattern: string[] = [];
      const pattern = /^(51804|51803)\d{7}$/;

      lines.forEach(id => {
        if (!pattern.test(id)) failedList.push({ id, reason: 'Format Salah (Wajib 12 Digit)' });
        else validIdsAfterPattern.push(id);
      });

      if (validIdsAfterPattern.length === 0 && failedList.length > 0) {
          setSessionResult({ total: lines.length, success: 0, failed: failedList.length, failedList: failedList, timestamp: new Date().toLocaleTimeString() });
          setLoading(false);
          playSound('error');
          return;
      }

      const whitelistedIds = await api.checkWhitelist(validIdsAfterPattern);
      const alreadySubmittedIds = await api.checkDuplicates(validIdsAfterPattern);

      const finalValidIds: string[] = [];
      validIdsAfterPattern.forEach(id => {
          if (!whitelistedIds.includes(id)) failedList.push({ id, reason: 'IDPEL Tidak Terdaftar' });
          else if (alreadySubmittedIds.includes(id)) failedList.push({ id, reason: 'Sudah pernah diinput' });
          else finalValidIds.push(id);
      });

      if (finalValidIds.length > 0) {
        const timestamp = new Date().toLocaleString('id-ID');
        const newEntries: EntryLog[] = finalValidIds.map(id => ({ idpel: id, petugas: user.username, timestamp: timestamp, status: 'OK' }));
        await api.submitEntries(newEntries);
        playSound('success');
      } else playSound('error');

      setSessionResult({ total: lines.length, success: finalValidIds.length, failed: failedList.length, failedList: failedList, timestamp: new Date().toLocaleTimeString() });
      setLoading(false);
      if (finalValidIds.length > 0) setInputText(''); 
    } catch (err: any) {
      setLoading(false);
      alert(err.message || "Gagal memproses data ke server.");
    }
  };

  if (isLocked) {
      return (
          <div className="p-4 pb-24 pt-10 min-h-[60vh] flex flex-col items-center justify-center text-center">
              <div className="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
                  <CalendarOff size={64} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase">Sistem Cut-Off</h2>
              <p className="text-gray-500 mb-6 max-w-xs text-sm">Menu Entry Transaksi sedang ditutup sementara untuk proses rekonsiliasi bulanan.</p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm w-full max-w-sm">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Jadwal Tutup</span>
                      <span className="text-xs font-bold text-red-600">Tgl 28 (20:00)</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Jadwal Buka</span>
                      <span className="text-xs font-bold text-green-600">Tgl 02 (10:00)</span>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 pb-24 pt-6">
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-800 flex items-center text-sm uppercase tracking-tight">
                <SearchCheck className="mr-2 text-pln-blue w-5 h-5" />
                Input Transaksi PLN Mobile
            </h2>
            <div className="bg-blue-50 text-pln-blue px-2 py-1 rounded text-[10px] font-bold">VALIDASI AKTIF</div>
        </div>
        
        <p className="text-[11px] text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 leading-relaxed italic">
            Tempelkan daftar IDPEL (maks 75 baris). Sistem akan memvalidasi data terhadap database master secara otomatis.
        </p>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Contoh:&#10;518040000806&#10;518040000807"
          className="w-full h-56 p-4 border border-blue-100 bg-slate-50/50 rounded-2xl focus:ring-2 focus:ring-pln-blue outline-none resize-none font-mono text-base font-bold text-gray-800 shadow-inner placeholder:opacity-30"
          inputMode="numeric"
        />
        
        <div className="mt-2 flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Jumlah Baris</span>
            <span className={`text-xs font-bold ${inputText.split('\n').filter(l => l.trim()).length > 75 ? 'text-red-500' : 'text-pln-blue'}`}>
                {inputText.split('\n').filter(l => l.trim()).length} / 75 IDPEL
            </span>
        </div>

        <button
          onClick={validateAndSubmit}
          disabled={!inputText || inputText.split('\n').filter(l => l.trim()).length > 75}
          className="w-full mt-5 bg-pln-blue disabled:bg-gray-200 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center uppercase tracking-widest text-sm"
        >
          <Save className="mr-2 w-4 h-4" /> Proses Validasi & Simpan
        </button>
      </div>

      {sessionResult && (
        <div className="animate-fade-in space-y-4">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-wider flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-2 text-pln-blue"/> Hasil Pemrosesan Terakhir
                    </h3>
                    <span className="text-[9px] font-mono text-gray-400 bg-white px-2 py-0.5 rounded border">{sessionResult.timestamp}</span>
                </div>
                
                <div className="p-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <span className="block text-[9px] text-gray-400 font-black uppercase mb-1">Total</span>
                        <span className="text-xl font-black text-gray-800">{sessionResult.total}</span>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                        <span className="block text-[9px] text-green-600 font-black uppercase mb-1">Sukses</span>
                        <span className="text-xl font-black text-green-600">{sessionResult.success}</span>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <span className="block text-[9px] text-red-600 font-black uppercase mb-1">Gagal</span>
                        <span className="text-xl font-black text-red-600">{sessionResult.failed}</span>
                    </div>
                </div>

                {sessionResult.failed > 0 && (
                    <div className="border-t border-gray-50 p-4 pt-0">
                        <p className="text-[10px] font-black text-red-500 mb-2 uppercase tracking-tight flex items-center">
                            <XCircle className="w-3 h-3 mr-1"/> Log Penolakan:
                        </p>
                        <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <ul className="space-y-2">
                                {sessionResult.failedList.map((fail, idx) => (
                                    <li key={idx} className="text-[10px] flex justify-between items-start border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                                        <span className="font-mono font-bold text-gray-700 bg-white px-1.5 rounded border shadow-sm">{fail.id}</span>
                                        <span className="text-red-600 font-medium text-right ml-4 italic">{fail.reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
             </div>
        </div>
      )}
    </div>
  );
};
