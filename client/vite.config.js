import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendProxy = { target: 'http://localhost:3000', changeOrigin: true, secure: false };

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': backendProxy,
      '/auth': backendProxy,
      '/config': backendProxy,
      '/user-status': backendProxy,
      '/access': backendProxy,
    },
  },
});
