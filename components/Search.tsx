import React, { useState } from 'react';
import { Customer, User } from '../types';
import { api } from '../services/dataService';
import { playSound } from '../services/soundService';
import { READING_DAYS } from '../constants';
import { 
  Search as SearchIcon, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Filter, 
  Zap, 
  Info, 
  Activity,
  UserSearch,
  Hash,
  Copy,
  CheckCheck
} from 'lucide-react';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    playSound('success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKeyword = keyword.trim();
    if (!cleanKeyword) return;
    
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    
    try {
      let data: Customer[] = [];
      if (/^\d+$/.test(cleanKeyword)) {
        data = await api.searchCustomers(cleanKeyword);
      } else {
        data = await api.searchByName(cleanKeyword.toUpperCase());
      }
      setResults(data);
      playSound(data.length > 0 ? 'success' : 'error');
    } catch (err) { 
      playSound('error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFilterSearch = async (selectedDay: string) => {
    if (!selectedDay) return;
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    try {
      const data = await api.searchByCriteria(user.username, selectedDay);
      setResults(data);
      playSound(data.length > 0 ? 'success' : 'error');
    } catch (err) { playSound('error'); }
    finally { setLoading(false); }
  };

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const displayed = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="px-6 md:px-8 space-y-6 animate-fade-in pb-32">
      <div className="relative pt-4">
        <form onSubmit={handleSmartSearch} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative premium-glass p-1.5 rounded-[2rem] flex items-center bg-slate-900/80">
             <div className="pl-5 text-slate-500">
                {/^\d+$/.test(keyword) ? <Hash size={18} /> : <UserSearch size={18} />}
             </div>
             <input 
               type="text" 
               value={keyword}
               onChange={(e) => setKeyword(e.target.value)}
               placeholder="IDPEL, Nama, No Meter..." 
               className="flex-1 bg-transparent border-none outline-none px-4 py-4 font-bold text-white placeholder:text-slate-600 text-sm" 
             />
             <button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 w-12 h-12 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl active:scale-90 transition transform">
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
             className="bg-transparent text-[10px] font-black uppercase text-slate-300 outline-none cursor-pointer"
           >
             <option value="" className="bg-slate-900">PILIH HARI BACA</option>
             {READING_DAYS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
           </select>
        </div>
        {searched && (
          <button onClick={() => { setResults([]); setSearched(false); setKeyword(''); setReadDay(''); }} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-2xl shrink-0">
            Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        {searched && results.length === 0 && (
          <div className="py-24 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Data Tidak Ditemukan</p>
          </div>
        )}

        {displayed.map((c, i) => {
          const isExactMatch = c.idpel === keyword;
          // Gunakan koordinat jika ada, jika tidak gunakan Nama+Alamat
          const hasCoords = c.koordinat_x && c.koordinat_y;
          const mapUrl = hasCoords 
            ? `https://www.google.com/maps/search/?api=1&query=${c.koordinat_x},${c.koordinat_y}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.nama + ' ' + c.alamat)}`;
          
          return (
            <div key={i} className={`relative premium-glass rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${isExactMatch ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'border-white/5'} animate-fade-in`}>
              <div className="p-6">
                <div className="mb-4 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5 mb-1">
                      <Zap size={14} className="text-yellow-400 shrink-0" />
                      {/* Font nama diperkecil dari text-sm ke text-xs */}
                      <h3 className="text-xs font-black text-white uppercase truncate">{c.nama}</h3>
                    </div>
                    <div className="flex items-center space-x-2 pl-6">
                       <p className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">{c.jenis_layanan}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 px-3 py-1 rounded-lg text-[7px] font-black uppercase ${c.status === 'AKTIF' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} border border-white/5`}>
                    {c.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="relative group">
                    <InfoItem icon={Hash} label="IDPEL" value={c.idpel} highlight={isExactMatch} />
                    <button onClick={() => handleCopy(c.idpel)} className="absolute top-2 right-2 p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                        {copiedId === c.idpel ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <InfoItem icon={Activity} label="NO METER" value={c.no_meter || '-'} />
                </div>

                <div className="bg-slate-900/40 rounded-2xl p-4 mb-4 border border-white/5">
                   <div className="flex items-start space-x-3">
                      <MapPin className="text-blue-400 shrink-0 mt-0.5" size={14} />
                      <div className="flex-1">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Alamat</p>
                         <p className="text-[9px] font-bold text-slate-200 uppercase leading-relaxed tracking-wide">{c.alamat}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <TechnicalBox label="T/D" value={`${c.tarif}/${c.daya}`} />
                  <TechnicalBox label="G/T" value={`${c.gardu}/${c.no_tiang}`} />
                  <TechnicalBox label="HARI" value={c.hari_baca} />
                </div>

                <button 
                  onClick={() => window.open(mapUrl, '_blank')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-[9px] tracking-[0.2em] flex items-center justify-center space-x-2 active:scale-95 transition-all uppercase"
                >
                  <Compass size={16} className="animate-spin-slow" />
                  <span>BUKA NAVIGASI {hasCoords ? 'KOORDINAT' : 'ALAMAT'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {results.length > ITEMS_PER_PAGE && (
          <div className="flex justify-between items-center bg-slate-900/90 p-3 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white disabled:opacity-10 transition-colors">
              <ChevronLeft size={20}/>
            </button>
            <div className="text-center">
               <span className="text-xs font-black text-white">{currentPage} / {totalPages}</span>
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white disabled:opacity-10 transition-colors">
              <ChevronRight size={20}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, highlight }: any) => (
  <div className={`p-3 rounded-2xl border ${highlight ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-900/60 border-white/5'}`}>
    <div className="flex items-center space-x-1.5 mb-1 opacity-40">
      <Icon size={10} className={highlight ? 'text-yellow-400' : 'text-slate-400'} />
      <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-[10px] font-mono font-bold truncate ${highlight ? 'text-yellow-400' : 'text-slate-100'}`}>{value}</p>
  </div>
);

const TechnicalBox = ({ label, value }: any) => (
  <div className="text-center p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
    <p className="text-[6px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-[9px] font-black text-white truncate">{value}</p>
  </div>
);
