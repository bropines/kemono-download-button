import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const indexContent = fs.readFileSync(path.join(rootDir, 'src/index.ts'), 'utf-8');
const headerMatch = indexContent.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
const header = headerMatch ? headerMatch[0] : '';

const bundlePath = path.join(rootDir, 'dist/bundle.js');
let bundleCode = fs.readFileSync(bundlePath, 'utf-8');

// AdGuard concatenates every enabled userscript (and their @require files) into one script.
// So the bundle must not depend on what comes before or after it, nor take anything down with it:
// - the leading `;` ends a previous script that left its last statement open,
// - the function scope keeps Vite's `var KemonoDownloadButton` off the shared global scope,
// - try/catch stops our start-up error from aborting the scripts concatenated after us,
// - the flag keeps a second injection into the same page from running everything twice.
const finalScript = `${header}

;(function () {
  if (window.__kemonoDownloadButtonLoaded) return;
  window.__kemonoDownloadButtonLoaded = true;
  try {
${bundleCode.trim()}
  } catch (error) {
    console.error('[Kemono DL] failed to start', error);
  }
})();
`;

// Standard single update file for Tampermonkey / Violentmonkey
const permanentUserJs = path.join(rootDir, 'kemono-download-button.user.js');

fs.writeFileSync(permanentUserJs, finalScript, 'utf-8');

console.log(`Successfully generated:\n - ${permanentUserJs}`);
