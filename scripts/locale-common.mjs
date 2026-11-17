// Shared by sign-locales.mjs and verify-locales.mjs.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const localesDir = path.join(rootDir, 'locales');
export const indexPath = path.join(localesDir, 'index.json');

/** The public key embedded in the script (src/i18n/publicKey.ts). */
export function embeddedPublicKey() {
  const source = fs.readFileSync(path.join(rootDir, 'src/i18n/publicKey.ts'), 'utf8');
  const field = (name) => {
    const match = new RegExp(`\\b${name}:\\s*'([A-Za-z0-9_-]+)'`).exec(source);
    if (!match) throw new Error(`src/i18n/publicKey.ts: no "${name}"`);
    return match[1];
  };
  return crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: field('x'), y: field('y') }, format: 'jwk' });
}

/** Pack files: locales/<code>.json, without index.json. */
export function packFiles() {
  return fs
    .readdirSync(localesDir)
    .filter((name) => name.endsWith('.json') && name !== 'index.json')
    .sort();
}

export const sha256Hex = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

// Raw r||s (IEEE P1363), the format WebCrypto verifies
export const sign = (bytes, privateKey) =>
  crypto.sign('sha256', bytes, { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64');

export function verify(bytes, signatureBase64, publicKey) {
  const signature = Buffer.from(signatureBase64.trim(), 'base64');
  if (signature.length !== 64) return false;
  return crypto.verify('sha256', bytes, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
}

/** Checks a pack's shape; returns a list of problems. */
export function packProblems(name, bytes) {
  const problems = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) problems.push('starts with a UTF-8 BOM');
  if (bytes.includes(0x0d)) problems.push('contains CR characters (save with LF line endings)');
  let pack;
  try {
    pack = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    return [...problems, `invalid JSON: ${error.message}`];
  }
  const code = name.replace(/\.json$/, '');
  if (pack.code !== code) problems.push(`"code" is "${pack.code}", expected "${code}"`);
  if (typeof pack.name !== 'string' || !pack.name) problems.push('"name" is missing');
  if (!Number.isInteger(pack.version) || pack.version < 1) problems.push('"version" must be a positive integer');
  if (!pack.ui || typeof pack.ui !== 'object') problems.push('"ui" must be an object');
  if (!pack.site || typeof pack.site !== 'object') problems.push('"site" must be an object');
  return problems.length ? problems : { pack };
}

/** Keys of the English baseline (src/i18n/en/*.ts), read as text. */
export function englishKeys() {
  const dir = path.join(rootDir, 'src/i18n/en');
  const keys = new Set();
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.ts') && n !== 'index.ts')) {
    const source = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const match of source.matchAll(/^\s*(['"])([^'"]+)\1\s*:/gm)) keys.add(match[2]);
  }
  return keys;
}

// Keys built at run time (src/i18n/README.md), so they are not in the baseline
export const CONVENTION_KEY = /^(mod\.|modules\.group\.|settings\.tab\.)/;
