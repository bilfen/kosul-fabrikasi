import { defineConfig } from 'vite';

// Göreli yol: uygulama GitHub Pages'te alt dizinden de açılabilsin.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
});
