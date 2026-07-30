import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

const indexContent = fs.readFileSync(path.join(rootDir, 'src/index.ts'), 'utf-8');
const headerMatch = indexContent.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
const header = headerMatch ? headerMatch[0] : '';

const bundlePath = path.join(rootDir, 'dist/bundle.js');
let bundleCode = fs.readFileSync(bundlePath, 'utf-8');

const finalScript = `${header}\n\n${bundleCode}`;

// Standard permanent update file name for Tampermonkey / Violentmonkey auto-updates
const permanentUserJs = path.join(rootDir, 'kemono-download-button.user.js');

// Versioned output files for release archives
const versionedUserJs = path.join(rootDir, `Kemono Download Button-${version}.user.js`);
const versionedTxt = path.join(rootDir, `Kemono Download Button-${version}.txt`);

fs.writeFileSync(permanentUserJs, finalScript, 'utf-8');
fs.writeFileSync(versionedUserJs, finalScript, 'utf-8');
fs.writeFileSync(versionedTxt, finalScript, 'utf-8');

console.log(`Successfully generated:\n - ${permanentUserJs}\n - ${versionedUserJs}\n - ${versionedTxt}`);
