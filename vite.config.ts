import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@store': resolve(__dirname, 'src/store'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@commands': resolve(__dirname, 'src/commands'),
      '@components': resolve(__dirname, 'src/components'),
      '@data': resolve(__dirname, 'src/data'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
