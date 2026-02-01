
export enum Role {
  ADMIN = 'ADMIN',
  OFFICER = 'OFFICER'
}

export interface User {
  username: string; // e.g., "51804.AGUNG"
  role: Role;
  deviceId: string | null;
  name: string;
}

export interface Customer {
  idpel: string;
  no_meter: string;
  kddk: string;
  hari_baca: string;
  petugas: string;
  nama: string;
  alamat: string;
  tarif: string;
  daya: number;
  gardu: string;
  no_tiang: string;
  jenis_layanan: string;
  status: string;
  koordinat_x: string;
  koordinat_y: string;
  row_index: number; // Menggunakan snake_case sesuai DB
}

export interface Arrear {
  petugas: string;
  idpel: string;
  kddk: string;
  hari: string;
  nama: string;
  alamat: string;
  tarif: string;
  daya: number;
  gardu: string;
  no_tiang: string;
  rptag: number;
  lembar: number;
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

export interface AppDatabase {
  users: User[];
  customers: Customer[];
  arrears: Arrear[];
  trxku: string[];
  entryku: EntryLog[];
}
