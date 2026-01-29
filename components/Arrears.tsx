
import React, { useState, useEffect, useRef } from 'react';
import { User, Arrear } from '../types';
import { api } from '../services/dataService';
import { playSound } from '../services/soundService';
import { Download, LayoutGrid, List, Wallet2, TrendingUp, CreditCard, Eye, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ArrearsProps {
  user: User;
  setLoading: (loading: boolean) => void;
}

export const Arrears: React.FC<ArrearsProps> = ({ user, setLoading }) => {
  const [data, setData] = useState<Arrear[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const fetched = await api.getArrears(user.username);
            setData(fetched);
        } catch (e) { 
            console.error("Gagal mengambil data tunggakan:", e); 
        } finally { 
            setLoading(false); 
        }
    };
    fetchData();
  }, [user.username, setLoading]); 

  const totalRupiah = data.reduce((acc, curr) => acc + curr.rptag, 0);

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const handleDownload = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diunduh. Silakan upload master tunggakan terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const headers = [['PETUGAS', 'IDPEL', 'HARI', 'NAMA PELANGGAN', 'ALAMAT', 'TARIF', 'DAYA', 'GARDU', 'NO_TIANG', 'RPTAG']];
      
      const rows = data.map(item => [
        item.petugas,
        item.idpel, 
        item.hari,
        item.nama,
        item.alamat,
        item.tarif,
        item.daya,
        item.gardu,
        item.no_tiang,
        item.rptag
      ]);

      const worksheetData = [...headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellIdpel = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (cellIdpel) {
           cellIdpel.t = 's'; 
           cellIdpel.z = '@'; 
        }
        
        const cellRptag = ws[XLSX.utils.encode_cell({ r: R, c: 9 })];
        if (cellRptag) {
           cellRptag.t = 'n'; 
           cellRptag.z = '#,##0'; 
        }
      }

      ws['!cols'] = [
        { wch: 15 }, 
        { wch: 20 }, 
        { wch: 6 },  
        { wch: 25 }, 
        { wch: 40 }, 
        { wch: 8 },  
        { wch: 10 }, 
        { wch: 12 }, 
        { wch: 12 }, 
        { wch: 15 }  
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "TUNGGAKAN");
      XLSX.writeFile(wb, `DATA_TUNGGAKAN_${user.username}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
      
      playSound('success');
    } catch (e) {
      alert("Error saat mengunduh Excel: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 space-y-8 animate-fade-in">
      
      {/* Dashboard Monitor Tunggakan */}
      <div className="relative h-64 w-full rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black p-8 overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <TrendingUp size={120} className="text-cyan-500" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                 <Wallet2 size={20} className="text-cyan-400" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Piutang Pelanggan</span>
            </div>
            <CreditCard size={24} className="text-white/20" />
          </div>
          
          <div className="mb-4">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Total Saldo Tunggakan</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tighter">
              <span className="text-xl mr-2 text-slate-500 font-medium">Rp</span>
              {formatIDR(totalRupiah)}
            </h2>
          </div>
          
          <div className="flex justify-between items-end border-t border-white/10 pt-4">
             <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Pelanggan</p>
               <p className="text-xl font-bold text-white leading-none">{data.length}</p>
             </div>
             <div className="text-right">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Petugas</p>
               <p className="text-xs font-black text-green-400 uppercase">{user.username}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleDownload} 
          className="flex-1 bg-white text-slate-950 p-4 rounded-[2rem] flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-xl font-black text-[10px] tracking-widest"
        >
          <FileSpreadsheet size={18} />
          <span>UNDUH EXCEL</span>
        </button>
        <button 
          onClick={() => setShowPreview(true)} 
          className="w-16 bg-cyan-500/10 border border-cyan-500/30 rounded-[2rem] flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 active:scale-90 transition-transform"
        >
          <Eye size={20}/>
        </button>
      </div>

      <div className="space-y-4 pb-32">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">Rincian Per Pelanggan</h4>
        {data.length > 0 ? data.map((item, idx) => (
          <div key={idx} className="premium-glass p-6 rounded-[2.5rem] flex items-center justify-between group border-white/5 hover:border-cyan-500/30 transition-all duration-300">
             <div className="flex items-center space-x-5">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-xs text-slate-400 border border-white/5 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                 {item.hari}
               </div>
               <div>
                 <p className="text-sm font-black text-white uppercase leading-tight group-hover:text-cyan-400 transition-colors">{item.nama}</p>
                 <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">{item.idpel}</p>
               </div>
             </div>
             <div className="text-right">
               <p className="text-sm font-black text-white">Rp {formatIDR(item.rptag)}</p>
               <p className="text-[8px] font-black text-red-500 uppercase mt-1">BELUM TERBAYAR</p>
             </div>
          </div>
        )) : (
          <div className="py-20 text-center opacity-30 flex flex-col items-center">
             <FileSpreadsheet size={48} className="text-slate-600 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Belum ada data tunggakan</p>
             <p className="text-[8px] font-bold text-slate-500 uppercase mt-2 italic">Pastikan petugas sudah sesuai di master data</p>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl animate-fade-in flex flex-col">
          <div className="px-8 py-8 flex justify-between items-center border-b border-white/5">
             <div className="flex items-center space-x-3">
               <Eye className="text-cyan-400" />
               <h3 className="font-black text-white text-sm uppercase tracking-widest">Pratinjau Data Tunggakan</h3>
             </div>
             <button onClick={() => setShowPreview(false)} className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
               <X size={20} />
             </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <table className="w-full border-collapse rounded-2xl overflow-hidden shadow-2xl">
              <thead className="bg-black text-white text-[9px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5 text-left border-b border-slate-800">PELANGGAN</th>
                  <th className="px-6 py-5 text-left border-b border-slate-800">ALAMAT</th>
                  <th className="px-6 py-5 text-right border-b border-slate-800">RPTAG</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/60 text-slate-300">
                {data.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-[10px] uppercase truncate max-w-[150px]">{item.nama}</td>
                    <td className="px-6 py-4 font-medium text-[9px] uppercase leading-relaxed text-slate-400">{item.alamat}</td>
                    <td className="px-6 py-4 text-right font-black text-[10px] text-cyan-400">Rp {formatIDR(item.rptag)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 border-t border-white/5 bg-slate-950/50">
             <button onClick={handleDownload} className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-[2rem] font-black text-[11px] tracking-widest uppercase flex items-center justify-center shadow-xl active:scale-95 transition-all">
                <FileSpreadsheet className="mr-3" size={18} /> UNDUH DATA EXCEL SEKARANG
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
