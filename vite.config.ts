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
    // The userscript header is prepended afterwards by scripts/postbuild.mjs, so minifying cannot strip it
    minify: 'esbuild',
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
