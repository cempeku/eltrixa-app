import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Mengambil environment variables dengan cara yang aman dari runtime crash.
 */
const getEnv = (key: string): string => {
  try {
    // Cara standar Vite
    const viteEnv = (import.meta as any).env?.[key];
    if (viteEnv) return viteEnv;

    // Fallback yang aman dari ReferenceError: process is not defined
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.[key]) {
      return (globalThis as any).process.env[key];
    }
  } catch (e) {
    // Silent fail
  }
  return '';
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Inisialisasi client hanya jika kredensial tersedia
export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY) 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

/**
 * Mengecek apakah konfigurasi Supabase sudah lengkap.
 */
export const isConfigured = (): boolean => {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY && supabase);
};
