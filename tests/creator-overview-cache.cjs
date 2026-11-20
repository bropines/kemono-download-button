const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// A small IndexedDB stand-in preserves data across simulated page reloads.
const entries = new Map();
let created = false;
const database = {
  createObjectStore: () => ({ createIndex() {} }), close() {},
  transaction() {
    const tx = {};
    const finish = () => queueMicrotask(() => tx.oncomplete?.());
    tx.objectStore = () => ({
      get(key) { const req = {}; queueMicrotask(() => { req.result = entries.get(key); req.onsuccess?.(); }); return req; },
      put(entry) { entries.set(entry.key, structuredClone(entry)); },
      delete(key) { entries.delete(key); },
      clear() { entries.clear(); finish(); },
      index() { return { openCursor() {
        const req = {};
        const values = [...entries.values()].sort((a, b) => a.saved - b.saved);
        let i = 0;
        const next = () => queueMicrotask(() => {
          if (i >= values.length) { req.result = null; req.onsuccess?.(); finish(); return; }
          req.result = { value: values[i++], continue: next };
          req.onsuccess?.();
        });
        next();
        return req;
      } }; },
    });
    return tx;
  },
};
const indexedDB = { open() { const req = {}; queueMicrotask(() => { req.result = database; if (!created) { created = true; req.onupgradeneeded?.(); } req.onsuccess?.(); }); return req; } };
let now = 1000000000;
const window = { location: { origin: 'https://one.example' } };
function load() {
  const source = fs.readFileSync('src/api/creatorOverviewCache.ts', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, indexedDB, window, Date: { now: () => now }, JSON, Map, Promise };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const api = load();
  let calls = 0;
  let resolveFetch;
  const fetch = () => { calls++; return new Promise(resolve => { resolveFetch = resolve; }); };
  const first = api.cachedCreatorOverview('tags', 'fanbox', '1', fetch);
  const concurrent = api.cachedCreatorOverview('tags', 'fanbox', '1', fetch);
  await flush();
  assert.equal(calls, 1, 'concurrent callers share one request');
  resolveFetch([{ tag: 'a' }]);
  assert.deepEqual(await first, await concurrent);
  await flush();
  const reloaded = load();
  await reloaded.cachedCreatorOverview('tags', 'fanbox', '1', () => { throw Error('should read IndexedDB'); });
  assert.equal(calls, 1, 'fresh response survives a reload');
  window.location.origin = 'https://two.example';
  await reloaded.cachedCreatorOverview('tags', 'fanbox', '1', async () => { calls++; return []; });
  assert.equal(calls, 2, 'origins are isolated');
  window.location.origin = 'https://one.example';
  now += 48 * 60 * 60 * 1000;
  await reloaded.cachedCreatorOverview('tags', 'fanbox', '1', async () => { calls++; return []; });
  assert.equal(calls, 3, 'expired data is fetched again');
  let failed = 0;
  const fail = async () => { failed++; throw Error('network'); };
  await assert.rejects(reloaded.cachedCreatorOverview('links', 'fanbox', '1', fail));
  await assert.rejects(reloaded.cachedCreatorOverview('links', 'fanbox', '1', fail));
  assert.equal(failed, 2, 'errors are not cached');
  let malformed = 0;
  const bad = async () => { malformed++; return { error: true }; };
  await reloaded.cachedCreatorOverview('links', 'fanbox', '1', bad);
  await reloaded.cachedCreatorOverview('links', 'fanbox', '1', bad);
  assert.equal(malformed, 2, 'non-array responses are not cached');
  const malformedRow = async () => { malformed++; return [{ error: 'unavailable' }]; };
  await reloaded.cachedCreatorOverview('links', 'fanbox', '1', malformedRow);
  await reloaded.cachedCreatorOverview('links', 'fanbox', '1', malformedRow);
  assert.equal(malformed, 4, 'invalid array entries are not cached');
  let oldResolve;
  const old = reloaded.cachedCreatorOverview('announcements', 'fanbox', '1', () => new Promise(resolve => { oldResolve = resolve; }));
  await flush();
  await reloaded.clearCreatorOverviewCache();
  oldResolve([{ content: 'old' }]);
  await old;
  await flush();
  const newer = await reloaded.cachedCreatorOverview('announcements', 'fanbox', '1', async () => [{ content: 'new' }]);
  assert.equal(newer[0].content, 'new', 'an old in-flight request cannot refill a cleared cache');
  for (let i = 0; i < 110; i++) {
    now++;
    await reloaded.cachedCreatorOverview('tags', 'fanbox', String(i), async () => [{ tag: String(i) }]);
    await flush();
  }
  assert.ok(entries.size <= 100, 'persistent cache is bounded');
  console.log('creator API cache checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
