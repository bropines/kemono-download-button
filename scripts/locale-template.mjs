// Starts a translation: writes locales/<code>.json with every string to translate.
//
//   npm run locale-template -- de "Deutsch"
//
// `ui` gets the English text of every baseline key (src/i18n/en), so you translate in place. Module texts
// (mod.*, modules.group.*, settings.tab.*, themes.preset.*) and the site dictionary are listed from ru.json
// with empty values: the English source of a site entry is its key; for module texts see the module in
// Settings → Modules (or ru.json). Anything left empty or unchanged simply shows in English.
// An existing file is updated: translations already in it are kept, new keys are added.
import fs from 'fs';
import path from 'path';
import { englishBaseline, indexPath, loadValidator, localesDir } from './locale-common.mjs';

const [code, name] = process.argv.slice(2);
const { CONVENTION_KEY, LANG_CODE, parseIndex } = await loadValidator();
if (!code || !LANG_CODE.test(code) || code === 'en') {
  console.error('Usage: npm run locale-template -- <code> ["Native name"]   e.g. npm run locale-template -- de "Deutsch"');
  process.exit(1);
}

const file = path.join(localesDir, `${code}.json`);
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const reference = JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf8'));
const english = await englishBaseline();

const ui = {};
for (const [key, text] of Object.entries(english)) ui[key] = existing?.ui?.[key] ?? text;
for (const key of Object.keys(reference.ui).filter((k) => CONVENTION_KEY.test(k)).sort()) ui[key] = existing?.ui?.[key] ?? '';
for (const [key, text] of Object.entries(existing?.ui ?? {})) if (!(key in ui)) ui[key] = text;
const site = {};
for (const key of Object.keys(reference.site)) site[key] = existing?.site?.[key] ?? '';
for (const [key, text] of Object.entries(existing?.site ?? {})) if (!(key in site)) site[key] = text;

const pack = { code, name: name || existing?.name || code, version: existing?.version ?? 1, ui, site };
fs.writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);

const index = parseIndex(JSON.parse(fs.readFileSync(indexPath, 'utf8'))).packs;
if (!index.some((p) => p.code === code)) {
  index.push({ code, name: pack.name, version: pack.version });
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`added ${code} to locales/index.json`);
}
console.log(`${existing ? 'updated' : 'wrote'} locales/${code}.json: ${Object.keys(ui).length} ui / ${Object.keys(site).length} site strings`);
