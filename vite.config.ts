import { defineConfig } from 'vite';
import path from 'path';

const rootDir = path.resolve(__dirname, 'src/client');

export default defineConfig({
  root: rootDir,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(rootDir, 'index.html'),
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
