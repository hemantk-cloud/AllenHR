import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure process.env is available for the Gemini SDK
    'process.env': process.env
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  esbuild: {
    // Explicitly tell esbuild to use the 'tsx' loader for these extensions
    loader: 'tsx',
    include: /.*\.(ts|tsx|jsx|js)$/,
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
