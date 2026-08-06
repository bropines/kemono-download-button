import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KemonoDownloadButton',
      formats: ['iife'],
      fileName: () => 'bundle.js'
    },
    minify: false,
    rollupOptions: {
      external: ['plyr'],
      output: {
        globals: {
          plyr: 'Plyr'
        }
      }
    }
  }
});
