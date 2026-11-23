const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/modules/creatorLinks/searchSites.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const context = { exports: {}, URL };
vm.runInNewContext(compiled, context);
const { DEFAULT_SEARCHES, parseSearchSites, serializeSearchSites, searchSiteProblem, fillSearchUrl } = context.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));

// The stored text keeps its format: the defaults survive a parse/serialize round trip byte for byte
const defaults = parseSearchSites(DEFAULT_SEARCHES);
assert.equal(defaults.length, 11);
assert.deepEqual(plain(defaults[0]), { label: 'E-Hentai', url: 'https://e-hentai.org/?f_search=artist%3A%22{name}%24%22' });
assert.equal(serializeSearchSites(defaults), DEFAULT_SEARCHES);
assert.ok(defaults.every((site) => searchSiteProblem(site) === null));

// Text written by hand in the old textarea: CRLF, blank lines, loose spacing, a "|" inside the URL
const legacy = '  Danbooru|https://danbooru.donmai.us/posts?tags={tag}  \r\n\r\nMy site |  https://x.test/s?q={name}|raw\n';
assert.deepEqual(plain(parseSearchSites(legacy)), [
  { label: 'Danbooru', url: 'https://danbooru.donmai.us/posts?tags={tag}' },
  { label: 'My site', url: 'https://x.test/s?q={name}|raw' },
]);
assert.equal(serializeSearchSites(parseSearchSites(legacy)), 'Danbooru | https://danbooru.donmai.us/posts?tags={tag}\nMy site | https://x.test/s?q={name}|raw');

// Broken lines are kept as entries (the editor flags them) instead of being dropped on the next save
assert.deepEqual(plain(parseSearchSites('just a note\nhttps://bare.test/{name}')), [
  { label: 'just a note', url: '' },
  { label: '', url: 'https://bare.test/{name}' },
]);
const kept = serializeSearchSites(parseSearchSites('just a note\nhttps://bare.test/{name}'));
assert.deepEqual(plain(parseSearchSites(kept)), plain(parseSearchSites('just a note\nhttps://bare.test/{name}')));
assert.equal(serializeSearchSites([{ label: '', url: '' }, { label: ' A  b ', url: ' https://a.test/{tag}\n' }]), 'A b | https://a.test/{tag}');
assert.equal(serializeSearchSites([]), '');
assert.deepEqual(plain(parseSearchSites('')), []);
assert.deepEqual(plain(parseSearchSites(undefined)), []);

// Validation, in the order a user fixes things
const problem = (label, url) => searchSiteProblem({ label, url });
assert.equal(problem('', 'https://a.test/{name}'), 'labelMissing');
assert.equal(problem('a|b', 'https://a.test/{name}'), 'labelPipe');
assert.equal(problem('A', ''), 'urlMissing');
assert.equal(problem('A', 'ftp://a.test/{name}'), 'urlScheme');
assert.equal(problem('A', 'a.test/{name}'), 'urlScheme');
assert.equal(problem('A', 'https://'), 'urlInvalid');
assert.equal(problem('A', 'https://a.test/search'), 'placeholderMissing');
assert.equal(problem('A', 'https://a.test/search?q={tag}'), null);

assert.equal(fillSearchUrl('https://a.test/?q={name}&t={tag}&n={name}', { name: 'Big%20Cat', tag: 'big_cat' }), 'https://a.test/?q=Big%20Cat&t=big_cat&n=Big%20Cat');
assert.equal(fillSearchUrl('javascript:alert(1)', { name: 'x', tag: 'x' }), null);

console.log('search sites checks passed');
