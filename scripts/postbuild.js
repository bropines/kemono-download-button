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

const finalScript = `${header}\n\n${bundleCode}`;

const outputFileUserJs = path.join(rootDir, 'Kemono Download Button-0.2.0.user.js');
const outputFileTxt = path.join(rootDir, 'Kemono Download Button-0.2.0.txt');

fs.writeFileSync(outputFileUserJs, finalScript, 'utf-8');
fs.writeFileSync(outputFileTxt, finalScript, 'utf-8');

console.log(`Successfully generated:\n - ${outputFileUserJs}\n - ${outputFileTxt}`);
