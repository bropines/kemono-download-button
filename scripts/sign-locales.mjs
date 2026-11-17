// Signs every locales/<code>.json and rebuilds + signs locales/index.json.
//
//   npm run sign-locales            (private key from $KDL_LOCALE_KEY (PEM) or .keys/locale-signing.pem)
//
// A pack whose content changed must have a higher "version" than its index entry; otherwise clients
// that already cached that version would never pick the change up. --force skips that check.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { embeddedPublicKey, indexPath, localesDir, packFiles, packProblems, rootDir, sha256Hex, sign, verify } from './locale-common.mjs';

const force = process.argv.includes('--force');

function loadPrivateKey() {
  const fromEnv = process.env.KDL_LOCALE_KEY;
  const file = path.join(rootDir, '.keys/locale-signing.pem');
  const pem = fromEnv?.trim() ? fromEnv.replace(/\\n/g, '\n') : fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (!pem) {
    console.error('No signing key: set KDL_LOCALE_KEY (PEM) or put it in .keys/locale-signing.pem');
    process.exit(1);
  }
  return crypto.createPrivateKey(pem);
}

const privateKey = loadPrivateKey();
const publicKey = embeddedPublicKey();

// The key must belong to the public key the script ships with, or every client rejects the packs
const probe = Buffer.from('kdl-locale-key-check');
if (!verify(probe, sign(probe, privateKey), publicKey)) {
  console.error('The signing key does not match the public key in src/i18n/publicKey.ts');
  process.exit(1);
}

const previous = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : { packs: [] };
const packs = [];
let failed = false;

for (const name of packFiles()) {
  const file = path.join(localesDir, name);
  const bytes = fs.readFileSync(file);
  const checked = packProblems(name, bytes);
  if (Array.isArray(checked)) {
    checked.forEach((problem) => console.error(`${name}: ${problem}`));
    failed = true;
    continue;
  }
  const { pack } = checked;
  const sha256 = sha256Hex(bytes);
  const before = previous.packs?.find((p) => p.code === pack.code);
  if (before && before.sha256 !== sha256 && pack.version <= before.version && !force) {
    console.error(`${name}: content changed but version is still ${pack.version}; raise "version" (or pass --force)`);
    failed = true;
    continue;
  }
  fs.writeFileSync(`${file}.sig`, sign(bytes, privateKey));
  packs.push({ code: pack.code, name: pack.name, version: pack.version, sha256 });
  console.log(`signed ${name} (v${pack.version}, ${Object.keys(pack.ui).length} ui / ${Object.keys(pack.site).length} site strings)`);
}

if (failed) process.exit(1);

const indexBytes = Buffer.from(JSON.stringify({ packs }, null, 2) + '\n', 'utf8');
fs.writeFileSync(indexPath, indexBytes);
fs.writeFileSync(`${indexPath}.sig`, sign(indexBytes, privateKey));
console.log(`signed index.json (${packs.length} packs)`);
