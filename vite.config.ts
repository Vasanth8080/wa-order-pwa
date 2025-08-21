import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WhatsApp Order Router',
        short_name: 'WA Router',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#16a34a',
        icons: [],
      },
    }),
  ],
  server: { port: 5173, host: true },
});
