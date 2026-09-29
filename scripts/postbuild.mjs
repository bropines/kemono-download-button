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

// Standard single update file for Tampermonkey / Violentmonkey
const permanentUserJs = path.join(rootDir, 'kemono-download-button.user.js');

fs.writeFileSync(permanentUserJs, finalScript, 'utf-8');

console.log(`Successfully generated:\n - ${permanentUserJs}`);
