const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// src/utils/searchKey.ts: a Latin or Cyrillic query finds kana, kanji (through their English name) and hangul
const compiled = ts.transpileModule(fs.readFileSync('src/utils/searchKey.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const sandbox = {
  exports: {},
  require: (id) => {
    if (id === 'wanakana') return require('wanakana');
    if (id === '../state/gmStorage') return { readStored: (_k, fallback) => fallback, writeStored() {} };
    if (id === '../services/translators') return { translateLinesGoogle: async (lines) => lines.map((l) => ({ '初音ミク': 'Hatsune Miku', '김민지': 'Kim Min-ji' })[l] || '') };
    throw new Error(id);
  },
  String, Array, Object, Set, Math, Promise,
};
vm.runInNewContext(compiled, sandbox);
const { searchKey, queryVariants, matchesQuery, translateNames } = sandbox.exports;

const finds = (query, ...texts) => matchesQuery(texts.map(searchKey), queryVariants(query));

(async () => {
  // Kana as rōmaji, from Latin and Cyrillic (plain and Polivanov) queries
  assert.ok(finds('sakura', 'さくら'));
  assert.ok(finds('сакура', 'さくら'));
  assert.ok(finds('miku', 'ミク'));
  assert.ok(finds('мику', 'ミク'));
  assert.ok(finds('shiro', 'しろ'), 'shi');
  assert.ok(finds('сиро', 'しろ'), 'Polivanov си = shi');
  assert.ok(finds('цубаса', 'つばさ'), 'Polivanov цу = tsu');
  assert.ok(finds('toranoana', 'とらのあな'));
  // Long vowels and macrons meet their short form
  assert.ok(finds('tokyo', 'とうきょう'));
  assert.ok(finds('tokyo', 'Tōkyō'));
  assert.ok(finds('ryo', 'Ryou'));
  // Kanji and hangul through their English name
  const english = await translateNames(['初音ミク', '김민지', 'plain']);
  assert.equal(english['初音ミク'], 'Hatsune Miku');
  assert.ok(!('plain' in english), 'names without kanji or hangul are not sent');
  assert.ok(finds('hatsune', '初音ミク', english['初音ミク']));
  assert.ok(finds('хацунэ мику', '初音ミク', english['初音ミク']));
  assert.ok(finds('kim min', '김민지', english['김민지']));
  // The query in the script itself still works, and Cyrillic names meet Cyrillic queries
  assert.ok(finds('初音', '初音ミク'));
  assert.ok(finds('иван', 'Иван Петров'));
  assert.ok(finds('ivan', 'Иван Петров'));
  // No false match
  assert.ok(!finds('naruto', 'さくら'));
  assert.ok(!finds('сакура naruto', 'さくら'), 'every word must be found');
  console.log('search-key: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
