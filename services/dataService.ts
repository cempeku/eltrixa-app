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
      const { data: target, error: targetErr } = await supabase
        .from('customers')
        .select('*')
        .eq('idpel', idpel.trim())
        .single();
      
      if (targetErr || !target) {
        const { data: partials } = await supabase.from('customers').select('*').ilike('idpel', `%${idpel}%`).limit(10);
        return partials || [];
      }

      // Ambil tetangga berdasarkan row_index yang sudah urut
      const { data: before } = await supabase.from('customers')
        .select('*')
        .eq('petugas', target.petugas)
        .eq('hari_baca', target.hari_baca)
        .lt('row_index', target.row_index)
        .order('row_index', { ascending: false })
        .limit(5);

      const { data: after } = await supabase.from('customers')
        .select('*')
        .eq('petugas', target.petugas)
        .eq('hari_baca', target.hari_baca)
        .gt('row_index', target.row_index)
        .order('row_index', { ascending: true })
        .limit(4);

      const sortedBefore = before ? [...before].reverse() : [];
      return [...sortedBefore, target, ...(after || [])];
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
      const cleanPetugas = usernameLogin.trim().toUpperCase();
      const cleanHari = hari.trim().toUpperCase();
      
      const pascaDays = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const isPasca = pascaDays.includes(cleanHari);
      
      let query = supabase.from('customers')
        .select('*')
        .eq('petugas', cleanPetugas)
        .eq('hari_baca', cleanHari);
        
      if (isPasca) {
        query = query.or('jenis_layanan.ilike.PASCABAYAR,jenis_layanan.ilike.PASKABAYAR');
      } else {
        query = query.eq('jenis_layanan', 'PRABAYAR');
      }

      const { data, error } = await query.order('row_index', { ascending: true });
      if (error) console.error("Search criteria error:", error);
      return data || [];
    }
    return [];
  },

  getArrears: async (username: string): Promise<Arrear[]> => {
    if (isConfigured() && supabase) {
      let q = supabase.from('arrears').select('*');
      if (username !== 'ADMIN') q = q.eq('petugas', username.trim().toUpperCase());
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
    if (!isConfigured() || !supabase) return;
    
    // Hapus data lama secara total dan pastikan selesai sebelum insert
    const { error: delError } = await supabase.from('customers').delete().neq('idpel', 'HAPUS_SEMUA');
    if (delError) throw new Error("Gagal mengosongkan database lama.");

    const batch = data.map((r, i) => {
      // Mapping Header Presisi sesuai input user (prioritas case-insensitive)
      const getVal = (keys: string[]) => {
        for (const key of keys) {
          if (r[key] !== undefined && r[key] !== null) return String(r[key]).trim();
          if (r[key.toLowerCase()] !== undefined && r[key.toLowerCase()] !== null) return String(r[key.toLowerCase()]).trim();
          if (r[key.toUpperCase()] !== undefined && r[key.toUpperCase()] !== null) return String(r[key.toUpperCase()]).trim();
        }
        return '';
      };

      return {
        idpel: getVal(['idpel', 'IDPEL']),
        no_meter: getVal(['no_meter', 'NO_METER']),
        kddk: getVal(['kddk', 'KDDK']),
        hari_baca: getVal(['hari_baca', 'HARI_BACA']).toUpperCase(),
        petugas: getVal(['petugas', 'PETUGAS']).toUpperCase(),
        nama: getVal(['nama', 'NAMA']).toUpperCase(),
        alamat: getVal(['alamat', 'ALAMAT']).toUpperCase(),
        tarif: getVal(['tarif', 'TARIF']).toUpperCase(),
        daya: Number(getVal(['daya', 'DAYA']).replace(/\D/g, '') || 0),
        gardu: getVal(['gardu', 'GARDU']).toUpperCase(),
        no_tiang: getVal(['no_tiang', 'NO_TIANG']).toUpperCase(),
        jenis_layanan: getVal(['jenis_layanan', 'JENIS_LAYANAN']).toUpperCase(),
        status: getVal(['status', 'STATUS', 'AKTIF']).toUpperCase() || 'AKTIF',
        koordinat_x: getVal(['koordinat_x', 'KOORDINAT_X']),
        koordinat_y: getVal(['koordinat_y', 'KOORDINAT_Y']),
        row_index: i + 1 // Memastikan mulai dari 1
      };
    });

    await uploadInChunks('customers', batch, onProgress);
  },

  uploadArrears: async (data: any[], onProgress?: (p: number) => void) => {
    if (!isConfigured() || !supabase) return;
    await supabase.from('arrears').delete().neq('idpel', '0');
    const batch = data.map(r => ({
      petugas: String(r.petugas || r.PETUGAS || '').trim().toUpperCase(),
      idpel: String(r.idpel || r.IDPEL || '').trim(),
      nama: String(r.nama || r.NAMA || r['NAMA PELANGGAN'] || '').trim().toUpperCase(),
      alamat: String(r.alamat || r.ALAMAT || '').trim().toUpperCase(),
      tarif: String(r.tarif || r.TARIF || '').trim().toUpperCase(),
      daya: Number(String(r.daya || r.DAYA || 0).replace(/\D/g, '')),
      rptag: Number(String(r.rptag || r.RPTAG || 0).replace(/\D/g, '')),
      hari: String(r.hari_baca || r.hari || r.HARI || '').trim().toUpperCase(),
      kddk: String(r.kddk || r.KDDK || '').trim().toUpperCase(),
      gardu: String(r.gardu || r.GARDU || '').trim().toUpperCase(),
      no_tiang: String(r.no_tiang || r.NO_TIANG || '').trim().toUpperCase(),
    }));
    await uploadInChunks('arrears', batch, onProgress);
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
    if (!isConfigured() || !supabase) return;
    await supabase.from('trxku').delete().neq('idpel', '0');
    await uploadInChunks('trxku', idpels.map(id => ({ idpel: id.trim() })), onProgress);
  },

  uploadUsers: async (users: any[]) => {
    if (isConfigured() && supabase) {
      await supabase.from('users').upsert(users.map(r => ({
        username: String(r.username || r.USERNAME).trim().toUpperCase(),
        name: String(r.nama || r.NAMA || r.username || r.USERNAME).trim().toUpperCase(),
        role: (String(r.role || r.ROLE).trim().toUpperCase() === 'ADMIN') ? Role.ADMIN : Role.OFFICER,
        password: String(r.password || r.PASSWORD || '123').trim(),
        device_id: null
      })));
    }
  },

  clearAllCustomers: async () => isConfigured() && supabase?.from('customers').delete().neq('idpel', '0'),
  clearAllArrears: async () => isConfigured() && supabase?.from('arrears').delete().neq('idpel', '0'),
  clearAllWhitelist: async () => isConfigured() && supabase?.from('trxku').delete().neq('idpel', '0'),
  clearAllEntries: async () => isConfigured() && supabase?.from('entryku').delete().neq('idpel', '0'),
};
