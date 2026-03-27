import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/ton-wallet-dapp/',
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
});
