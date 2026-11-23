const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts)
const pageBody = (() => { const js = ts.transpileModule(fs.readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

// The file cache (src/services/cacheService.ts) keeps files only: no empty body, no web page. IndexedDB is absent
// here, so what comes back is what the in-memory layer accepted.
const compiled = ts.transpileModule(fs.readFileSync('src/services/cacheService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const imports = { '../utils/helpers': { debugLog() {} }, '../api/apiCache': { clearApiCache: async () => {} }, '../utils/pageBody': pageBody };
const sandbox = { exports: {}, require: (id) => { if (!(id in imports)) throw Error(id); return imports[id]; }, console: { error() {} }, setTimeout, clearTimeout, Date };
vm.runInNewContext(compiled, sandbox);
const { getCachedFile, setCachedFile } = sandbox.exports;
const bytes = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0)).buffer;

(async () => {
  await setCachedFile('https://n2.pawchive.pw/data/empty.jpeg', new ArrayBuffer(0));
  assert.equal(await getCachedFile('https://n2.pawchive.pw/data/empty.jpeg'), null, 'an empty body is not cached');

  await setCachedFile('https://n2.pawchive.pw/data/page.jpeg', bytes('<html>\r\n<head><title>302 Found</title></head></html>'));
  assert.equal(await getCachedFile('https://n2.pawchive.pw/data/page.jpeg'), null, 'a page is not cached');
  await setCachedFile('https://n2.pawchive.pw/data/bom.jpeg', bytes('\xef\xbb\xbf<!DOCTYPE html><html></html>'));
  assert.equal(await getCachedFile('https://n2.pawchive.pw/data/bom.jpeg'), null, 'nor one behind a byte order mark');

  const image = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).buffer;
  await setCachedFile('https://n2.pawchive.pw/data/image.jpeg', image);
  assert.equal(await getCachedFile('https://n2.pawchive.pw/data/image.jpeg'), image, 'a file is');
  console.log('file-cache-refuses: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
