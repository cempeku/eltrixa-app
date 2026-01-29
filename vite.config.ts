
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Menghapus define: { 'process.env': {} } agar tidak menimpa variabel lingkungan asli
});
