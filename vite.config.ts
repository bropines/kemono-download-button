import { defineConfig } from 'vite';
import { resolve } from 'path';

import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { version: string };

// `vite build --mode sleazyfork`: the copy for Sleazy Fork / Greasy Fork. Their rules forbid minified code and
// cap a script at 2 MB, so this build is not minified and leaves fflate and wanakana to @require lines (CDN code
// may be minified there); scripts/postbuild.mjs --target sleazyfork writes it with its own header.
export default defineConfig(({ mode }) => {
  const sleazy = mode === 'sleazyfork';
  return {
    // The script's version for the About section (src/ui/settings/sections/about.ts)
    define: { __KDL_VERSION__: JSON.stringify(pkg.version) },
    // Bundled data (skeleton snapshots, the Russian pack) as compact JSON strings, not pretty-printed objects
    json: { stringify: sleazy },
    build: {
      outDir: sleazy ? 'dist-sleazyfork' : 'dist',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'KemonoDownloadButton',
        formats: ['iife'],
        fileName: () => 'bundle.js'
      },
      // The userscript header is prepended afterwards by scripts/postbuild.mjs, so minifying cannot strip it
      minify: sleazy ? false : 'esbuild',
      rollupOptions: {
        external: sleazy ? ['plyr', 'fflate', 'wanakana'] : ['plyr'],
        output: {
          globals: {
            plyr: 'Plyr',
            fflate: 'fflate',
            wanakana: 'wanakana'
          }
        }
      }
    }
  };
});
