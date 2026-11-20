const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let now = 1000000000;
const disk = new Map([['post', { key: 'post', data: { revision: 'old' }, timestamp: now - 7200000 }]]);
const reads = [];
const db = {
  transaction() {
    const tx = {};
    tx.objectStore = () => ({
      get(key) { const req = {}; reads.push(() => { req.result = disk.get(key); req.onsuccess?.(); queueMicrotask(() => tx.oncomplete?.()); }); return req; },
      put(value) { disk.set(value.key, value); queueMicrotask(() => tx.oncomplete?.()); },
      delete(key) { disk.delete(key); },
    });
    return tx;
  },
};
const indexedDB = { open() { const req = {}; queueMicrotask(() => { req.result = db; req.onsuccess?.({ target: { result: db } }); }); return req; } };
const source = fs.readFileSync('src/services/cacheService.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const imports = {
  '../utils/helpers': { debugLog() {} },
  '../state/store': { state: { settings: { cacheDurationHours: 1 } } },
  '../api/creatorOverviewCache': { clearCreatorOverviewCache: async () => {} },
};
const sandbox = { exports: {}, require: id => imports[id], indexedDB, Date: { now: () => now }, console, setTimeout, clearTimeout, Map, Promise };
vm.runInNewContext(js, sandbox);
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const { getCachedPost, setCachedPost } = sandbox.exports;
  const old = getCachedPost('post');
  await flush();
  reads.shift()();
  assert.equal(await old, null, 'expired data is not returned');
  await flush();
  assert.equal(reads.length, 1, 'expiry cleanup is pending');
  now++;
  await setCachedPost('post', { revision: 'new' });
  reads.shift()();
  await flush();
  assert.equal(disk.get('post').data.revision, 'new', 'expiry cleanup does not delete a fresh write');
  assert.equal((await getCachedPost('post')).revision, 'new', 'fresh in-memory data remains available');
  console.log('post cache expiry race checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
