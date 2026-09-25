import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split large, independently-cacheable vendor dependencies out of
        // the main bundle so a change to application code does not force
        // browsers to re-download Cytoscape/MSAL on every deploy.
        manualChunks: {
          cytoscape: ['cytoscape'],
          msal: ['@azure/msal-browser'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});
