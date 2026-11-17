// Checks locales/ the way the script reads it (src/i18n/validate.ts). CI runs it on pushes and PRs.
//
// Fails on: index.json not a list of {code, name, version}, a listed pack missing or not listed, invalid
// JSON, BOM/CRLF, code or version not matching the index, non-string values, and translations that break
// their message: an unclosed brace, a malformed plural, or a {placeholder} the English text does not have.
// Warns on: untranslated (missing or empty) keys, keys the English baseline does not have, translations
// that leave out a placeholder.
//
//   npm run check-locales            all packs
//   npm run check-locales -- --quiet only errors and the per-pack summary
import fs from 'fs';
import path from 'path';
import { byteProblems, englishBaseline, indexPath, loadValidator, localesDir, packFiles } from './locale-common.mjs';

const quiet = process.argv.includes('--quiet');
const { CONVENTION_KEY, checkEntry, packShapeProblems, parseIndex } = await loadValidator();
const english = await englishBaseline();
const errors = [];
const warnings = [];
const list = (items, max = 15) => items.slice(0, max).join('\n    ') + (items.length > max ? `\n    … ${items.length - max} more` : '');

let index = { packs: [] };
try {
  const bytes = fs.readFileSync(indexPath);
  byteProblems(bytes).forEach((p) => errors.push(`index.json: ${p}`));
  const parsed = parseIndex(JSON.parse(bytes.toString('utf8')));
  parsed.problems.forEach((p) => errors.push(`index.json: ${p}`));
  index = parsed;
} catch (error) {
  errors.push(`index.json: ${error.message}`);
}

const files = packFiles();
for (const name of files) {
  if (!index.packs.some((p) => `${p.code}.json` === name)) errors.push(`${name}: not listed in index.json (add {"code", "name", "version"})`);
}

for (const entry of index.packs) {
  const name = `${entry.code}.json`;
  if (!files.includes(name)) {
    errors.push(`${name}: listed in index.json but missing`);
    continue;
  }
  const bytes = fs.readFileSync(path.join(localesDir, name));
  byteProblems(bytes).forEach((p) => errors.push(`${name}: ${p}`));
  let pack;
  try {
    pack = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    errors.push(`${name}: invalid JSON: ${error.message}`);
    continue;
  }
  const shape = packShapeProblems(pack, entry.code);
  if (shape.length) {
    shape.forEach((p) => errors.push(`${name}: ${p}`));
    continue;
  }
  if (pack.version !== entry.version) errors.push(`${name}: version ${pack.version} but index.json says ${entry.version}`);
  if (pack.name !== entry.name) warnings.push(`${name}: name "${pack.name}" but index.json says "${entry.name}"`);

  const broken = [];
  const unknown = [];
  const empty = [];
  const partial = [];
  for (const [key, value] of Object.entries(pack.ui)) {
    const known = Object.prototype.hasOwnProperty.call(english, key);
    if (!known && !CONVENTION_KEY.test(key)) unknown.push(key);
    const check = checkEntry(known ? english[key] : null, value);
    if (check.error === 'empty') empty.push(key);
    else if (check.error) broken.push(`ui "${key}": ${check.error}`);
    else if (check.warning) partial.push(`ui "${key}": ${check.warning}`);
  }
  for (const [key, value] of Object.entries(pack.site)) {
    const check = checkEntry(key, value);
    if (check.error === 'empty') empty.push(`site "${key}"`);
    else if (check.error) broken.push(`site "${key}": ${check.error}`);
    else if (check.warning) partial.push(`site "${key}": ${check.warning}`);
  }
  const missing = Object.keys(english).filter((key) => !(key in pack.ui));

  if (broken.length) errors.push(`${name}: ${broken.length} broken translations:\n    ${list(broken)}`);
  if (!quiet) {
    if (missing.length || empty.length) warnings.push(`${name}: ${missing.length + empty.length} untranslated keys (English shows):\n    ${list([...missing, ...empty])}`);
    if (unknown.length) warnings.push(`${name}: ${unknown.length} keys not in the English baseline (ignored by the script):\n    ${list(unknown)}`);
    if (partial.length) warnings.push(`${name}: ${partial.length} translations leave out a placeholder:\n    ${list(partial)}`);
  }
  console.log(`${broken.length ? 'FAIL' : 'ok'} ${name} v${pack.version}: ${Object.keys(pack.ui).length} ui / ${Object.keys(pack.site).length} site strings, ${missing.length + empty.length} untranslated`);
}

warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log('locales ok');
