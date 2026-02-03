import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Priority order for resolution
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json']
  },
  esbuild: {
    // Force JSX transformation for all TSX files
    include: /\.(tsx|ts|jsx|js)$/,
    loader: 'tsx'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
