import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    sourcemap: false,
    // Vite 8 default target is safari16.4/ios16.4, which keeps syntax such as class static
    // blocks (`static { ... }`). On iOS Safari < 16.4 that is a SyntaxError that aborts the
    // whole bundle -> empty #root (white screen). Lower the syntax for older iPhones.
    target: ['es2020', 'safari14', 'ios14', 'chrome100', 'edge100', 'firefox100'],
  },
  define: {
    'import.meta.env.VITE_USE_EMULATORS': JSON.stringify(process.env.VITE_USE_EMULATORS === 'true'),
  },
});
