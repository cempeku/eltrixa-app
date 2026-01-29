
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Mengambil environment variables dengan prioritas:
 * 1. Vite (import.meta.env) - Biasanya untuk lokal dev
 * 2. Process (process.env) - Biasanya diinject oleh Cloudflare saat runtime
 */
const getEnv = (key: string): string => {
  try {
    const viteEnv = (import.meta as any).env?.[key];
    if (viteEnv) return viteEnv;

    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Ignore error
  }
  return '';
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Inisialisasi client
export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY) 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

export const isConfigured = (): boolean => {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY && supabase);
};
