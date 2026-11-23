// Text matching of the settings search: case, accents and word order do not matter.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/ui/settings/searchText.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', compiled)(mod, mod.exports);
const { foldText, queryTerms, matchesTerms } = mod.exports;

assert.equal(foldText('  Ёлка   Café  '), 'елка cafe');
assert.equal(foldText('ПРЕДЗАГРУЗКА'), 'предзагрузка');
assert.deepEqual(queryTerms('  Cache   SIZE '), ['cache', 'size']);
assert.deepEqual(queryTerms('   '), []);

const label = foldText('Размер карточек — Ширина карточек в списках');
assert.ok(matchesTerms(label, queryTerms('карточ')));
assert.ok(matchesTerms(label, queryTerms('списках размер')), 'any word order');
assert.ok(!matchesTerms(label, queryTerms('размер видео')), 'every word must occur');
assert.ok(!matchesTerms(label, []), 'an empty query matches nothing');
assert.ok(matchesTerms(foldText('Résumé download'), queryTerms('resume')), 'accents are ignored');
assert.ok(matchesTerms(foldText('Объявление'), queryTerms('ОБЪЯВ')), 'case is ignored');
assert.ok(matchesTerms(foldText('Ещё'), queryTerms('еще')), 'ё matches е');

console.log('settings search text: all checks passed');
