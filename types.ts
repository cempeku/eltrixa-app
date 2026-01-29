
export enum Role {
  ADMIN = 'ADMIN',
  OFFICER = 'OFFICER'
}

export interface User {
  username: string; // e.g., "51804.AGUNG"
  // password removed for security. Handled by Supabase Auth.
  role: Role;
  deviceId: string | null; // For locking to a device
  name: string;
}

export interface Customer {
  idpel: string; // IDPEL
  no_meter: string; // NO_METER
  kddk: string; // KDDK
  hari_baca: string; // HARI_BACA
  petugas: string; // NAMA_PETUGAS
  nama: string; // NAMA PELANGGAN
  alamat: string; // ALAMAT
  tarif: string; // TARIF
  daya: number; // DAYA
  gardu: string; // GARDU
  no_tiang: string; // NO_TIANG
  jenis_layanan: string; // JENIS_LAYANAN
  status: string; // STATUS
  koordinat_x: string; // KOORDINAT_X
  koordinat_y: string; // KOORDINAT_Y
  rowIndex: number; // To maintain Excel order
}

export interface Arrear {
  petugas: string; // PETUGAS
  idpel: string; // IDPEL
  kddk: string; // KDDK
  hari: string; // HARI
  nama: string; // NAMA PELANGGAN
  alamat: string; // ALAMAT
  tarif: string; // TARIF
  daya: number; // DAYA
  gardu: string; // GARDU
  no_tiang: string; // NO_TIANG
  rptag: number; // RPTAG
  lembar: number; // calculated or default 1
}

export interface TrxData {
  idpel: string;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface EntryLog {
  idpel: string;
  petugas: string;
  timestamp: string;
  status: string;
}

// Database Mock Structure (For Offline Fallback)
export interface AppDatabase {
  users: User[];
  customers: Customer[];
  arrears: Arrear[];
  trxku: string[]; // List of valid IDPELs for transaction entry
  entryku: EntryLog[];
}
