// Verifies locales/ the way the script does, with the public key embedded in it (no secret needed):
// index.json signature, every pack listed with a matching SHA-256 and a valid signature, every pack
// file listed. Missing or unknown translation keys are reported as warnings.
import fs from 'fs';
import path from 'path';
import { CONVENTION_KEY, embeddedPublicKey, englishKeys, indexPath, localesDir, packFiles, packProblems, sha256Hex, verify } from './locale-common.mjs';

const publicKey = embeddedPublicKey();
const errors = [];
const warnings = [];

const readSig = (file) => (fs.existsSync(`${file}.sig`) ? fs.readFileSync(`${file}.sig`, 'utf8') : null);

const indexBytes = fs.readFileSync(indexPath);
const indexSig = readSig(indexPath);
if (!indexSig || !verify(indexBytes, indexSig, publicKey)) errors.push('index.json: missing or invalid signature');
const index = JSON.parse(indexBytes.toString('utf8'));

const english = englishKeys();
const files = packFiles();

for (const entry of index.packs ?? []) {
  const name = `${entry.code}.json`;
  const file = path.join(localesDir, name);
  if (!files.includes(name)) {
    errors.push(`${name}: listed in index.json but missing`);
    continue;
  }
  const bytes = fs.readFileSync(file);
  if (sha256Hex(bytes) !== entry.sha256) errors.push(`${name}: SHA-256 does not match index.json (run npm run sign-locales)`);
  const sig = readSig(file);
  if (!sig || !verify(bytes, sig, publicKey)) errors.push(`${name}: missing or invalid signature`);
  const checked = packProblems(name, bytes);
  if (Array.isArray(checked)) {
    checked.forEach((problem) => errors.push(`${name}: ${problem}`));
    continue;
  }
  const { pack } = checked;
  if (pack.version !== entry.version) errors.push(`${name}: version ${pack.version} but index.json says ${entry.version}`);
  const keys = Object.keys(pack.ui);
  const missing = [...english].filter((key) => !(key in pack.ui));
  const unknown = keys.filter((key) => !english.has(key) && !CONVENTION_KEY.test(key));
  if (missing.length) warnings.push(`${name}: ${missing.length} untranslated ui keys: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '…' : ''}`);
  if (unknown.length) warnings.push(`${name}: ${unknown.length} ui keys not in the English baseline: ${unknown.slice(0, 10).join(', ')}`);
  console.log(`ok ${name} v${pack.version}: ${keys.length} ui / ${Object.keys(pack.site).length} site strings`);
}

for (const name of files) {
  if (!(index.packs ?? []).some((p) => `${p.code}.json` === name)) errors.push(`${name}: not listed in index.json (run npm run sign-locales)`);
}

warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log('locales verified');
