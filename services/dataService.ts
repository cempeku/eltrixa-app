import { User, Customer, Arrear, EntryLog, Role } from '../types';
import { supabase, isConfigured } from './supabaseClient';
import * as XLSX from 'xlsx';

const CHUNK_SIZE = 2000;

export const getDeviceId = () => {
  let id = localStorage.getItem('eltrixa_device_id');
  if (!id) {
    id = "DEV-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem('eltrixa_device_id', id);
  }
  return id;
};

export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellText: true, cellNF: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
        resolve(json);
      } catch (err) { reject(new Error("Gagal membaca Excel.")); }
    };
    reader.readAsBinaryString(file);
  });
};

const uploadInChunks = async (tableName: string, data: any[], onProgress?: (p: number) => void) => {
  if (!supabase) return;
  const total = data.length;
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(tableName).insert(chunk);
    if (error) throw new Error(`Gagal upload baris ${i}: ${error.message}`);
    if (onProgress) onProgress(Math.min(i + CHUNK_SIZE, total));
  }
};

export const api = {
  login: async (username: string, passwordInput: string): Promise<User | null> => {
    const cleanU = username.trim().toUpperCase();
    if (isConfigured() && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('username', cleanU).single();
      if (error || !data) throw new Error("Akun tidak terdaftar.");
      if (passwordInput !== (data.password || '123')) throw new Error("Password Salah!");
      return { username: data.username, name: data.name, role: data.role as Role, deviceId: data.device_id };
    }
    throw new Error("Koneksi database bermasalah.");
  },

  updateUserDevice: async (username: string, deviceId: string | null) => {
    if (isConfigured() && supabase) await supabase.from('users').update({ device_id: deviceId }).eq('username', username);
  },

  searchCustomers: async (idpel: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      // 1. Cari target utama secara eksak
      const { data: target, error: targetErr } = await supabase
        .from('customers')
        .select('*')
        .eq('idpel', idpel.trim())
        .single();
      
      if (targetErr || !target) {
        // Jika tidak ketemu idpel pas, cari yang mirip (parsial)
        const { data: partials } = await supabase.from('customers').select('*').ilike('idpel', `%${idpel}%`).limit(10);
        return partials || [];
      }

      // 2. Ambil 5 SEBELUM (Petugas & Hari Baca sama, row_index lebih kecil)
      const { data: before } = await supabase.from('customers')
        .select('*')
        .eq('petugas', target.petugas)
        .eq('hari_baca', target.hari_baca)
        .lt('row_index', target.row_index)
        .order('row_index', { ascending: false })
        .limit(5);

      // 3. Ambil 4 SESUDAH (Petugas & Hari Baca sama, row_index lebih besar)
      const { data: after } = await supabase.from('customers')
        .select('*')
        .eq('petugas', target.petugas)
        .eq('hari_baca', target.hari_baca)
        .gt('row_index', target.row_index)
        .order('row_index', { ascending: true })
        .limit(4);

      // Gabungkan hasil: Before (diurutkan naik) + Target + After
      const sortedBefore = before ? [...before].sort((a, b) => a.row_index - b.row_index) : [];
      const finalResults = [...sortedBefore, target, ...(after || [])];
      
      return finalResults;
    }
    return [];
  },

  searchByName: async (name: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('customers').select('*').ilike('nama', `%${name}%`).limit(15);
      return data || [];
    }
    return [];
  },

  searchByCriteria: async (usernameLogin: string, hari: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      const pascaDays = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const isPasca = pascaDays.includes(hari);
      
      let query = supabase.from('customers')
        .select('*')
        .eq('petugas', usernameLogin)
        .eq('hari_baca', hari);
        
      // Filter layanan eksak (PASKABAYAR untuk A-G, PRABAYAR untuk lainnya seperti L-R)
      if (isPasca) {
        query = query.eq('jenis_layanan', 'PASKABAYAR');
      } else {
        query = query.eq('jenis_layanan', 'PRABAYAR');
      }

      // Selalu urutkan berdasarkan row_index agar Prabayar L M N P Q R tetap rapi sesuai Excel
      const { data, error } = await query.order('row_index', { ascending: true });
      if (error) console.error("Search criteria error:", error);
      return data || [];
    }
    return [];
  },

  getArrears: async (username: string): Promise<Arrear[]> => {
    if (isConfigured() && supabase) {
      let q = supabase.from('arrears').select('*');
      if (username !== 'ADMIN') q = q.eq('petugas', username);
      const { data } = await q;
      return data || [];
    }
    return [];
  },

  checkWhitelist: async (idpels: string[]): Promise<string[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('trxku').select('idpel').in('idpel', idpels);
      return data?.map(d => d.idpel) || [];
    }
    return [];
  },

  checkDuplicates: async (idpels: string[]): Promise<string[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('entryku').select('idpel').in('idpel', idpels);
      return data?.map(d => d.idpel) || [];
    }
    return [];
  },

  submitEntries: async (entries: EntryLog[]) => {
    if (isConfigured() && supabase) {
      await supabase.from('entryku').insert(entries.map(e => ({ idpel: e.idpel, petugas: e.petugas, status: e.status })));
    }
  },

  getAllEntryLogs: async () => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('entryku').select('*').order('timestamp', { ascending: false });
      return data || [];
    }
    return [];
  },

  getStats: async () => {
    if (isConfigured() && supabase) {
      const { data: usersData } = await supabase.from('users').select('*');
      const { count: cCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: aCount } = await supabase.from('arrears').select('*', { count: 'exact', head: true });
      const { count: wCount } = await supabase.from('trxku').select('*', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('entryku').select('*', { count: 'exact', head: true });
      const { data: logs } = await supabase.from('entryku').select('*').order('timestamp', { ascending: false }).limit(20);
      
      return { 
        officerCount: usersData?.length || 0, 
        activeCount: usersData?.filter(u => u.device_id).length || 0, 
        users: (usersData || []).map((u: any) => ({
          username: u.username,
          name: u.name,
          role: u.role as Role,
          deviceId: u.device_id
        })), 
        recentLogs: logs || [], 
        rowCounts: { customers: cCount || 0, arrears: aCount || 0, whitelist: wCount || 0, entries: eCount || 0 }
      };
    }
    return null;
  },

  uploadCustomers: async (data: any[], onProgress?: (p: number) => void) => {
    const batch = data.map((r, i) => ({
      idpel: String(r.IDPEL || r.idpel || '').trim(),
      no_meter: String(r.NO_METER || r.no_meter || '').trim(),
      kddk: String(r.KDDK || r.kddk || '').trim(),
      hari_baca: String(r.HARI_BACA || r.hari_baca || '').trim(),
      petugas: String(r.PETUGAS || r.NAMA_PETUGAS || r.nama_petugas || '').trim(),
      nama: String(r['NAMA PELANGGAN'] || r.nama || '').trim(),
      alamat: String(r.ALAMAT || r.alamat || '').trim(), // Spasi tengah aman, hanya ujung yang di-trim
      tarif: String(r.TARIF || r.tarif || '').trim(),
      daya: Number(String(r.DAYA || r.daya || 0).replace(/\D/g, '')),
      gardu: String(r.GARDU || r.gardu || '').trim(),
      no_tiang: String(r.NO_TIANG || r.no_tiang || '').trim(),
      jenis_layanan: String(r.JENIS_LAYANAN || r.jenis_layanan || '').trim().toUpperCase(),
      status: String(r.STATUS || r.status || 'AKTIF').trim().toUpperCase(),
      koordinat_x: String(r.KOORDINAT_X || r.koordinat_x || '').trim(),
      koordinat_y: String(r.KOORDINAT_Y || r.koordinat_y || '').trim(),
      row_index: i // Menyimpan urutan fisik file Excel
    }));
    if (isConfigured() && supabase) {
      await supabase.from('customers').delete().neq('idpel', '0');
      await uploadInChunks('customers', batch, onProgress);
    }
  },

  uploadArrears: async (data: any[], onProgress?: (p: number) => void) => {
    const batch = data.map(r => ({
      petugas: String(r.PETUGAS || r.petugas || '').trim(),
      idpel: String(r.IDPEL || r.idpel || '').trim(),
      nama: String(r['NAMA PELANGGAN'] || r.nama || '').trim(),
      alamat: String(r.ALAMAT || r.alamat || '').trim(),
      tarif: String(r.TARIF || r.tarif || '').trim(),
      daya: Number(String(r.DAYA || r.daya || 0).replace(/\D/g, '')),
      rptag: Number(String(r.RPTAG || r.rptag || 0).replace(/\D/g, '')),
      hari: String(r.HARI || r.hari || '').trim(),
      kddk: String(r.KDDK || r.kddk || '').trim(),
      gardu: String(r.GARDU || r.gardu || '').trim(),
      no_tiang: String(r.NO_TIANG || r.no_tiang || '').trim(),
    }));
    if (isConfigured() && supabase) {
      await supabase.from('arrears').delete().neq('idpel', '0');
      await uploadInChunks('arrears', batch, onProgress);
    }
  },

  uploadSettlements: async (idpels: string[], onProgress?: (p: number) => void) => {
    if (isConfigured() && supabase) {
      const total = idpels.length;
      for (let i = 0; i < total; i += 100) {
        const chunk = idpels.slice(i, i + 100);
        await supabase.from('arrears').delete().in('idpel', chunk);
        if (onProgress) onProgress(Math.min(i + 100, total));
      }
    }
  },

  uploadWhitelist: async (idpels: string[], onProgress?: (p: number) => void) => {
    if (isConfigured() && supabase) {
      await supabase.from('trxku').delete().neq('idpel', '0');
      await uploadInChunks('trxku', idpels.map(id => ({ idpel: id.trim() })), onProgress);
    }
  },

  uploadUsers: async (users: any[]) => {
    if (isConfigured() && supabase) {
      await supabase.from('users').upsert(users.map(r => ({
        username: String(r.USERNAME || r.username).trim().toUpperCase(),
        name: String(r.NAMA || r.nama || r.USERNAME || r.username).trim(),
        role: (String(r.ROLE || r.role).trim().toUpperCase() === 'ADMIN') ? Role.ADMIN : Role.OFFICER,
        password: String(r.PASSWORD || r.password || '123').trim(),
        device_id: null
      })));
    }
  },

  clearAllCustomers: async () => isConfigured() && supabase?.from('customers').delete().neq('idpel', '0'),
  clearAllArrears: async () => isConfigured() && supabase?.from('arrears').delete().neq('idpel', '0'),
  clearAllWhitelist: async () => isConfigured() && supabase?.from('trxku').delete().neq('idpel', '0'),
  clearAllEntries: async () => isConfigured() && supabase?.from('entryku').delete().neq('idpel', '0'),
};
