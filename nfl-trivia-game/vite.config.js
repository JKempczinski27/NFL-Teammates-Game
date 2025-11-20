import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // or 'https://studious-guide...5000' for GitHub Codespaces
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
