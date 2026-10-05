import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { sourcemap: false },
  define: {
    'import.meta.env.VITE_USE_EMULATORS': JSON.stringify(process.env.VITE_USE_EMULATORS === 'true'),
  },
});
