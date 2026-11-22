import { defineConfig } from 'vite';
import { resolve } from 'path';

import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { version: string };

export default defineConfig({
  // The script's version for the About section (src/ui/settings/sections/about.ts)
  define: { __KDL_VERSION__: JSON.stringify(pkg.version) },
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
