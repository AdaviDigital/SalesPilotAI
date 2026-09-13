import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Plain static build (dist/) — deployable as-is to Vercel (static),
// Render (static site), or Hostinger (upload dist/ contents). No
// framework-specific adapters required.
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
