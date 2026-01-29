
import React, { useState } from 'react';
import { Customer, User } from '../types';
import { api } from '../services/dataService';
import { playSound } from '../services/soundService';
import { READING_DAYS } from '../constants';
import { Search as SearchIcon, MapPin, ChevronLeft, ChevronRight, Compass, Filter, Target, UserCircle2, Zap, Landmark, Info, Tag, Activity } from 'lucide-react';

interface SearchProps {
  user: User;
  setLoading: (loading: boolean) => void;
}

export const Search: React.FC<SearchProps> = ({ user, setLoading }) => {
  const [keyword, setKeyword] = useState('');
  const [readDay, setReadDay] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    try {
      const data = /^\d+$/.test(keyword.trim()) 
        ? await api.searchCustomers(keyword.trim()) 
        : await api.searchByName(keyword.trim().toUpperCase());
      setResults(data);
      playSound(data.length > 0 ? 'success' : 'error');
    } catch (err) { playSound('error'); }
    finally { setLoading(false); }
  };

  const handleFilterSearch = async (selectedDay: string) => {
    if (!selectedDay) return;
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    try {
      const pascaDays = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const service = pascaDays.includes(selectedDay) ? 'PASCABAYAR' : 'PRABAYAR';
      const data = await api.searchByCriteria(user.username, selectedDay, service);
      setResults(data);
      playSound(data.length > 0 ? 'success' : 'error');
    } catch (err) { playSound('error'); }
    finally { setLoading(false); }
  };

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const displayed = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="px-8 space-y-8 animate-fade-in">
      
      <div className="relative pt-4">
        <form onSubmit={handleSmartSearch} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
          <div className="relative premium-glass p-1.5 rounded-[2.5rem] flex items-center">
             <input 
               type="text" 
               value={keyword}
               onChange={(e) => setKeyword(e.target.value)}
               placeholder="Ketik IDPEL atau Nama..." 
               className="flex-1 bg-transparent border-none outline-none px-6 py-4 font-bold text-white placeholder:text-slate-600 text-sm" 
             />
             <button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition transform">
               <SearchIcon size={20} />
             </button>
          </div>
        </form>
      </div>

      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl shrink-0">
           <Filter size={14} className="text-cyan-400" />
           <select 
             value={readDay} 
             onChange={(e) => { setReadDay(e.target.value); if(e.target.value) handleFilterSearch(e.target.value); }}
             className="bg-transparent text-[10px] font-black uppercase text-slate-300 outline-none"
           >
             <option value="" className="bg-slate-900">Filter Hari</option>
             {READING_DAYS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
           </select>
        </div>
      </div>

      <div className="space-y-8 pb-32">
        {searched && results.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <SearchIcon size={64} className="mx-auto text-slate-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Data Tidak Ditemukan</p>
          </div>
        )}

        {displayed.map((c, i) => {
          const isTarget = c.idpel === keyword;
          
          return (
            <div key={i} className={`relative premium-glass rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700 ${isTarget ? 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)]' : 'border-white/5'}`}>
              
              {isTarget && (
                <div className="absolute top-0 right-8 bg-gradient-to-b from-yellow-500 to-yellow-700 px-4 py-1.5 rounded-b-xl shadow-xl flex items-center space-x-2 z-20 animate-bounce">
                  <Target size={12} className="text-white fill-white/20" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">TARGET OPERASI</span>
                </div>
              )}

              <div className="p-6">
                <div className="mb-6 flex justify-between items-start">
                  <div className="max-w-[75%]">
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <Zap size={16} className="text-yellow-400 fill-yellow-400/20" />
                      <h3 className="text-lg font-black text-white tracking-tighter uppercase leading-none truncate">{c.nama}</h3>
                    </div>
                    <div className="flex items-center space-x-2 opacity-60">
                       <Tag size={10} className="text-cyan-400" />
                       <p className="text-[9px] font-black text-cyan-400 tracking-[0.1em] uppercase">{c.jenis_layanan}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${c.status === 'AKTIF' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
                    {c.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <InfoItem icon={Info} label="IDPEL" value={c.idpel} highlight={isTarget} />
                  <InfoItem icon={Activity} label="NO METER" value={c.no_meter} />
                  <InfoItem icon={Landmark} label="KDDK" value={c.kddk} />
                  <InfoItem icon={UserCircle2} label="PETUGAS" value={c.petugas} />
                </div>

                <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10">
                   <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-cyan-500/20 rounded-lg shrink-0">
                        <MapPin className="text-cyan-400" size={14} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Alamat</p>
                         <p className="text-[10px] font-bold text-slate-200 uppercase leading-relaxed text-balance">{c.alamat}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <TechnicalBox label="TARIF/DAYA" value={`${c.tarif}/${c.daya}VA`} />
                  <TechnicalBox label="GARDU/TIANG" value={`${c.gardu}/${c.no_tiang}`} />
                  <TechnicalBox label="HARI BACA" value={c.hari_baca} />
                </div>

                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.nama + ' ' + c.alamat)}`, '_blank')}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl font-black text-[9px] tracking-[0.2em] flex items-center justify-center space-x-3 shadow-lg active:scale-95 transition-all uppercase"
                >
                  <Compass size={16} className="animate-spin-slow" />
                  <span>BUKA NAVIGASI PETA</span>
                </button>
              </div>
            </div>
          );
        })}

        {results.length > ITEMS_PER_PAGE && (
          <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-3xl border border-white/10 backdrop-blur-xl">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white disabled:opacity-10 active:bg-cyan-500 transition-colors"
            >
              <ChevronLeft size={20}/>
            </button>
            <div className="text-center">
               <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Hal</span>
               <span className="text-xs font-black text-white">{currentPage} <span className="text-slate-600">/</span> {totalPages}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white disabled:opacity-10 active:bg-cyan-500 transition-colors"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, highlight }: any) => (
  <div className={`p-3 rounded-2xl border ${highlight ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-900/50 border-white/5'} transition-all`}>
    <div className="flex items-center space-x-2 mb-1 opacity-50">
      <Icon size={10} className={highlight ? 'text-yellow-400' : 'text-slate-400'} />
      <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-[10px] font-mono font-bold truncate ${highlight ? 'text-yellow-400' : 'text-slate-200'}`}>{value}</p>
  </div>
);

const TechnicalBox = ({ label, value }: any) => (
  <div className="text-center p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
    <p className="text-[6px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-[9px] font-black text-white truncate">{value}</p>
  </div>
);
