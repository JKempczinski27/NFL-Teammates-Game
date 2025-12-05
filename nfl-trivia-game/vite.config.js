import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to replace environment variables in HTML
const htmlEnvPlugin = () => {
  return {
    name: 'html-env-plugin',
    transformIndexHtml(html) {
      return html.replace(
        /%VITE_(\w+)%/g,
        (match, key) => process.env[`VITE_${key}`] || match
      );
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlEnvPlugin()],
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
