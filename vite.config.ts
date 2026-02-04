import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This is the critical fix for the blank screen on mobile
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    'global': {},
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  esbuild: {
    loader: 'tsx',
    include: /.*\.(ts|tsx|jsx|js)$/,
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild'
  }
});
