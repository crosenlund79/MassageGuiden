/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the built app works from any local folder or static server.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false },
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'MassageAtlas',
        short_name: 'MassageAtlas',
        description: 'Personlig massage- og anatomireference',
        lang: 'da',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F7F2E9',
        theme_color: '#343A32',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts']
  }
});
