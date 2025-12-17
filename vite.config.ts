
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to load assets from relative paths in production
  server: {
    port: 5173,
    strictPort: true,
    host: true, // This allows access from your local network (e.g. 192.168.x.x)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
