
import { User, Customer, Arrear, EntryLog, Role } from '../types';
import { supabase, isConfigured } from './supabaseClient';
import { localDB } from './localDb';
import * as XLSX from 'xlsx';

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
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) { reject(new Error("Gagal membaca Excel.")); }
    };
    reader.readAsBinaryString(file);
  });
};

export const api = {
  login: async (username: string, passwordInput: string): Promise<User | null> => {
    const cleanU = username.trim().toUpperCase();
    
    if (isConfigured() && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('username', cleanU).single();
      if (error || !data) throw new Error("Akun tidak terdaftar di database cloud.");
      if (passwordInput !== '123' && passwordInput !== 'password') throw new Error("Password Salah!");
      return { username: data.username, name: data.name, role: data.role as Role, deviceId: data.device_id };
    } else {
      // Local Mode Login (Simple)
      if (cleanU === 'ADMIN') return { username: 'ADMIN', name: 'Administrator Lokal', role: Role.ADMIN, deviceId: null };
      const users = await localDB.getAll('users');
      const user = users.find(u => u.username === cleanU);
      if (!user) throw new Error("Mode Lokal: Gunakan 'ADMIN' untuk masuk pertama kali.");
      return user;
    }
  },

  updateUserDevice: async (username: string, deviceId: string | null) => {
    if (isConfigured() && supabase) {
      await supabase.from('users').update({ device_id: deviceId }).eq('username', username);
    } else {
      const users = await localDB.getAll('users');
      const userIdx = users.findIndex(u => u.username === username);
      if (userIdx !== -1) {
        users[userIdx].deviceId = deviceId;
        await localDB.saveBatch('users', [users[userIdx]]);
      }
    }
  },

  searchCustomers: async (idpel: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      const { data: target } = await supabase.from('customers').select('*').eq('idpel', idpel).single();
      if (!target) {
        const { data: partials } = await supabase.from('customers').select('*').ilike('idpel', `%${idpel}%`).limit(10);
        return partials || [];
      }
      const { data: route } = await supabase.from('customers').select('*').eq('petugas', target.petugas).eq('hari_baca', target.hari_baca).order('row_index', { ascending: true });
      return route || [];
    } else {
      const all = await localDB.getAll('customers');
      const target = all.find(c => c.idpel === idpel);
      if (!target) return all.filter(c => c.idpel.includes(idpel)).slice(0, 10);
      return all.filter(c => c.petugas === target.petugas && c.hari_baca === target.hari_baca).sort((a,b) => a.row_index - b.row_index);
    }
  },

  searchByName: async (name: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('customers').select('*').ilike('nama', `%${name}%`).limit(50);
      return data || [];
    } else {
      return localDB.search('customers', c => c.nama.toUpperCase().includes(name.toUpperCase()));
    }
  },

  getArrears: async (username: string): Promise<Arrear[]> => {
    if (isConfigured() && supabase) {
      let q = supabase.from('arrears').select('*');
      if (username !== 'ADMIN') q = q.eq('petugas', username);
      const { data } = await q;
      return data || [];
    } else {
      const all = await localDB.getAll('arrears');
      return username === 'ADMIN' ? all : all.filter(a => a.petugas === username);
    }
  },

  checkWhitelist: async (idpels: string[]): Promise<string[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('trxku').select('idpel').in('idpel', idpels);
      return data?.map(d => d.idpel) || [];
    } else {
      const all = await localDB.getAll('whitelist');
      return all.filter(w => idpels.includes(w.idpel)).map(w => w.idpel);
    }
  },

  checkDuplicates: async (idpels: string[]): Promise<string[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('entryku').select('idpel').in('idpel', idpels);
      return data?.map(d => d.idpel) || [];
    } else {
      const all = await localDB.getAll('entries');
      return all.filter(e => idpels.includes(e.idpel)).map(e => e.idpel);
    }
  },

  submitEntries: async (entries: EntryLog[]) => {
    if (isConfigured() && supabase) {
      await supabase.from('entryku').insert(entries.map(e => ({ idpel: e.idpel, petugas: e.petugas, status: e.status })));
    } else {
      await localDB.saveBatch('entries', entries);
    }
  },

  getStats: async () => {
    if (isConfigured() && supabase) {
      const { data: users } = await supabase.from('users').select('*');
      const { count: cCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: aCount } = await supabase.from('arrears').select('*', { count: 'exact', head: true });
      const { count: wCount } = await supabase.from('trxku').select('*', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('entryku').select('*', { count: 'exact', head: true });
      const { data: logs } = await supabase.from('entryku').select('*').order('timestamp', { ascending: false }).limit(20);
      return { officerCount: users?.length || 0, activeCount: users?.filter(u => u.device_id).length || 0, users: users || [], recentLogs: logs || [], rowCounts: { customers: cCount || 0, arrears: aCount || 0, whitelist: wCount || 0, entries: eCount || 0 }};
    } else {
      const users = await localDB.getAll('users');
      return { 
        officerCount: users.length, 
        activeCount: users.filter(u => u.deviceId).length, 
        users, 
        recentLogs: (await localDB.getAll('entries')).reverse().slice(0, 20),
        rowCounts: {
          customers: await localDB.getCount('customers'),
          arrears: await localDB.getCount('arrears'),
          whitelist: await localDB.getCount('whitelist'),
          entries: await localDB.getCount('entries')
        }
      };
    }
  },

  uploadCustomers: async (data: any[]) => {
    const batch = data.map((r, i) => ({
      idpel: String(r.IDPEL || r.idpel || ''),
      no_meter: String(r.NO_METER || r.no_meter || ''),
      kddk: String(r.KDDK || r.kddk || ''),
      hari_baca: String(r.HARI_BACA || r.hari_baca || ''),
      petugas: String(r.NAMA_PETUGAS || r.nama_petugas || ''),
      nama: String(r['NAMA PELANGGAN'] || r.nama || ''),
      alamat: String(r.ALAMAT || r.alamat || ''),
      tarif: String(r.TARIF || r.tarif || ''),
      daya: Number(r.DAYA || r.daya || 0),
      gardu: String(r.GARDU || r.gardu || ''),
      no_tiang: String(r.NO_TIANG || r.no_tiang || ''),
      jenis_layanan: String(r.JENIS_LAYANAN || r.jenis_layanan || ''),
      status: String(r.STATUS || r.status || 'AKTIF'),
      row_index: i
    }));
    if (isConfigured() && supabase) {
      await supabase.from('customers').delete().neq('idpel', '0');
      await supabase.from('customers').insert(batch);
    } else {
      await localDB.clearStore('customers');
      await localDB.saveBatch('customers', batch);
    }
  },

  uploadArrears: async (data: any[]) => {
    const batch = data.map(r => ({
      petugas: String(r.PETUGAS || r.petugas || ''),
      idpel: String(r.IDPEL || r.idpel || ''),
      nama: String(r['NAMA PELANGGAN'] || r.nama || ''),
      alamat: String(r.ALAMAT || r.alamat || ''),
      tarif: String(r.TARIF || r.tarif || ''),
      daya: Number(r.DAYA || r.daya || 0),
      rptag: Number(r.RPTAG || r.rptag || 0),
      hari: String(r.HARI || r.hari || ''),
      kddk: String(r.KDDK || r.kddk || ''),
      gardu: String(r.GARDU || r.gardu || ''),
      no_tiang: String(r.NO_TIANG || r.no_tiang || ''),
    }));
    if (isConfigured() && supabase) {
      await supabase.from('arrears').delete().neq('idpel', '0');
      await supabase.from('arrears').insert(batch);
    } else {
      await localDB.clearStore('arrears');
      await localDB.saveBatch('arrears', batch);
    }
  },

  uploadWhitelist: async (idpels: string[]) => {
    const batch = idpels.map(id => ({ idpel: id }));
    if (isConfigured() && supabase) {
      await supabase.from('trxku').delete().neq('idpel', '0');
      await supabase.from('trxku').insert(batch);
    } else {
      await localDB.clearStore('whitelist');
      await localDB.saveBatch('whitelist', batch);
    }
  },

  uploadUsers: async (users: any[]) => {
    if (isConfigured() && supabase) {
      await supabase.from('users').upsert(users);
    } else {
      await localDB.saveBatch('users', users);
    }
  },

  searchByCriteria: async (petugas: string, hari: string, layanan: string): Promise<Customer[]> => {
    if (isConfigured() && supabase) {
      const { data } = await supabase.from('customers').select('*').eq('hari_baca', hari).eq('jenis_layanan', layanan).order('row_index', { ascending: true });
      return data || [];
    } else {
      const all = await localDB.getAll('customers');
      return all.filter(c => c.hari_baca === hari && c.jenis_layanan === layanan).sort((a,b) => a.row_index - b.row_index);
    }
  },

  clearAllCustomers: async () => isConfigured() ? supabase?.from('customers').delete().neq('idpel', '0') : localDB.clearStore('customers'),
  clearAllArrears: async () => isConfigured() ? supabase?.from('arrears').delete().neq('idpel', '0') : localDB.clearStore('arrears'),
  clearAllWhitelist: async () => isConfigured() ? supabase?.from('trxku').delete().neq('idpel', '0') : localDB.clearStore('whitelist'),
  clearAllEntries: async () => isConfigured() ? supabase?.from('entryku').delete().neq('idpel', '0') : localDB.clearStore('entries'),
};
