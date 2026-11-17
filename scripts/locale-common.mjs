// Shared by verify-locales.mjs and locale-template.mjs.
//
// The English baseline (src/i18n/en/*.ts) and the pack checks (src/i18n/validate.ts) are TypeScript;
// they are compiled in memory with the project's TypeScript, so CI checks exactly what the script runs.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const localesDir = path.join(rootDir, 'locales');
export const indexPath = path.join(localesDir, 'index.json');

/** Imports a self-contained TypeScript module (no imports of its own). */
async function importTs(file) {
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

export const loadValidator = () => importTs(path.join(rootDir, 'src/i18n/validate.ts'));

/** key -> English text, in the order of src/i18n/en/index.ts */
export async function englishBaseline() {
  const dir = path.join(rootDir, 'src/i18n/en');
  const order = [...fs.readFileSync(path.join(dir, 'index.ts'), 'utf8').matchAll(/^import \w+ from '\.\/(\w+)';/gm)].map((m) => m[1]);
  const baseline = {};
  for (const name of order) Object.assign(baseline, (await importTs(path.join(dir, `${name}.ts`))).default);
  return baseline;
}

/** Pack files: locales/<code>.json, without index.json. */
export function packFiles() {
  return fs
    .readdirSync(localesDir)
    .filter((name) => name.endsWith('.json') && name !== 'index.json')
    .sort();
}

/** Encoding problems of a file's bytes */
export function byteProblems(bytes) {
  const problems = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) problems.push('starts with a UTF-8 BOM (save as UTF-8 without BOM)');
  if (bytes.includes(0x0d)) problems.push('contains CR characters (save with LF line endings)');
  return problems;
}
