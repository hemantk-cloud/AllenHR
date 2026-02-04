import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Fixed: Using a valid JS literal string '{}' instead of '({})'
    'process.env': '{}',
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'global': 'window',
  },
  server: {
    host: true,
    port: 3000
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild'
  }
});
