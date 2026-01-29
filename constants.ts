
import { LucideIcon, Zap, Search, DollarSign, FileSpreadsheet, LogOut, UserCog, UploadCloud } from "lucide-react";
import { Customer, Arrear } from "./types";

export const APP_NAME = "ELTRIXA";
export const APP_VERSION = "1.2.5";

export const MENUS: { id: string; label: string; icon: any }[] = [
  { id: 'search', label: 'Cari Pelanggan', icon: Search },
  { id: 'arrears', label: 'Data Tunggakan', icon: DollarSign },
  { id: 'entry', label: 'Input PLN Mobile', icon: Zap },
  { id: 'admin', label: 'Panel Kontrol', icon: UserCog },
];

export const SERVICE_TYPES = ['PASCABAYAR', 'PRABAYAR'];

export const READING_DAYS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 
    'L', 'M', 'N', 'P', 'Q', 'R'
]; 

export const VALID_ID_PREFIXES = ['51804', '51803'];

export const MOTIVATIONAL_QUOTES = [
  "Kerja keras tidak akan mengkhianati hasil. Istirahatlah, pahlawan terang!",
  "Satu langkah kecil hari ini adalah awal kesuksesan besar esok hari.",
  "Terima kasih atas dedikasimu menjaga cahaya tetap menyala.",
  "Lelahmu akan menjadi lillah. Selamat beristirahat.",
  "Setiap tantangan adalah peluang untuk berkembang. Sampai jumpa besok!",
  "Keberhasilan adalah kumpulan dari usaha kecil yang diulang setiap hari.",
  "Jangan lupa bersyukur atas pencapaian hari ini.",
  "Pulanglah dengan bangga, tugas mulia telah tertunaikan.",
  "Energi positifmu menerangi sekitarmu, sama seperti listrik yang kau jaga.",
  "Disiplin adalah jembatan antara tujuan dan pencapaian. Kerja bagus!"
];
