import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This ensures that 'process.env' is treated as an object literal in the code
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || ''),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
    },
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
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000 // Silences the chunk size warning
  }
});
