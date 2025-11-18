import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Shared backend for NFL Games Hub
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
