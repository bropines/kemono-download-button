const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercises src/api/apiCache.ts with a fake clock, fake timers, a fake network and a small IndexedDB stand-in
// that keeps its data across simulated page loads (load() builds a fresh module instance).
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
let now = 1_000_000_000;

// ---- timers (eviction runs on a timer; the IndexedDB deadline is a timer that is normally cleared) ----
let timers = new Map();
let timerId = 0;
const fakeSetTimeout = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, at: now + (ms || 0) }); return id; };
const fakeClearTimeout = (id) => timers.delete(id);
function runTimers() {
  for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
}

// ---- IndexedDB stand-in ----
const stores = { responses: new Map(), meta: new Map() };
let dbBroken = false;
const clone = (v) => (v === undefined ? undefined : structuredClone(v));
function transaction() {
  const tx = {};
  let pending;
  const arm = () => { clearImmediate(pending); pending = setImmediate(() => tx.oncomplete?.()); };
  arm();
  tx.objectStore = (name) => {
    const map = stores[name];
    return {
      get(key) { arm(); const req = {}; queueMicrotask(() => { req.result = clone(map.get(key)); req.onsuccess?.(); arm(); }); return req; },
      put(value) { arm(); map.set(value.key, clone(value)); },
      delete(key) { arm(); map.delete(key); },
      clear() { arm(); map.clear(); },
      openCursor() {
        arm();
        const req = {};
        const values = [...map.values()].map(clone);
        let i = 0;
        const next = () => queueMicrotask(() => { arm(); req.result = i < values.length ? { value: values[i++], continue: next } : null; req.onsuccess?.(); });
        next();
        return req;
      },
    };
  };
  return tx;
}
const database = { objectStoreNames: { contains: () => false }, createObjectStore() {}, transaction, close() {} };
let deleted = [];
const indexedDB = {
  open() {
    const req = {};
    queueMicrotask(() => {
      if (dbBroken) { req.onerror?.(); return; }
      req.result = database;
      req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  },
  deleteDatabase(name) { deleted.push(name); },
};

// ---- network ----
const settings = { apiCacheLifetime: 'normal' };
let calls = [];
let reply = () => ({ response: [] });
async function gmXmlhttpRequestWithRetries(details) {
  calls.push(details.url);
  const answer = await reply(details);
  if (answer instanceof Error) throw answer;
  return answer;
}
class AbortErr extends Error { constructor() { super('aborted'); this.name = 'AbortError'; } }

const source = fs.readFileSync('src/api/apiCache.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function load() {
  const imports = {
    '../state/store': { state: { settings }, getSettings: async () => {} },
    '../utils/http': { gmXmlhttpRequestWithRetries, abortError: () => new AbortErr() },
  };
  const sandbox = {
    exports: {}, require: (id) => { if (!(id in imports)) throw Error(id); return imports[id]; },
    indexedDB, Date: { now: () => now }, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
    JSON, Map, Set, Promise, Math, Array, Object, Number, String, console,
  };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise((resolve) => setImmediate(resolve)); };
const A = 'https://one.example/api/v1/patreon/user/1';
const count = (url) => calls.filter((c) => c === url).length;

(async () => {
  let api = load();

  // TTL table
  assert.equal(api.policyFor(`${A}/profile`).cls, 'profile');
  assert.equal(api.policyFor(`${A}/post/5`).cls, 'post');
  assert.equal(api.policyFor(`${A}/post/5/comments`).cls, 'comments');
  assert.equal(api.policyFor(`${A}/tags`).cls, 'overview');
  assert.equal(api.policyFor(`${A}/posts?o=50`).cls, 'creatorPosts');
  assert.equal(api.policyFor(`${A}?o=50&tag=x`).cls, 'creatorPosts');
  assert.equal(api.policyFor(`${A}/posts?q=cat`).cls, 'search');
  assert.equal(api.policyFor('https://one.example/api/v1/posts?o=0').cls, 'posts');
  assert.equal(api.policyFor('https://one.example/api/v1/posts/popular?date=2024').cls, 'posts');
  assert.equal(api.policyFor('https://one.example/api/v1/search_hash/abc').cls, 'hash');
  assert.equal(api.policyFor('https://one.example/api/v1/creators.txt').cls, 'creators');
  assert.equal(api.policyFor('https://one.example/api/v1/account/favorites?type=post').ttl, 0, 'account data is never stored');

  // De-dup: concurrent callers share one request; different URLs do not
  let release;
  reply = () => new Promise((resolve) => { release = () => resolve({ response: { id: '1', name: 'one' } }); });
  const first = api.apiGet(`${A}/profile`);
  const second = api.apiGet(`${A}/profile`);
  await flush();
  assert.equal(count(`${A}/profile`), 1, 'concurrent callers share one request');
  release();
  assert.deepEqual(await first, await second);
  await flush();

  // Served from memory, then from IndexedDB after a "reload"
  await api.apiGet(`${A}/profile`);
  assert.equal(count(`${A}/profile`), 1, 'fresh entry served from memory');
  api = load();
  assert.equal((await api.apiGet(`${A}/profile`)).name, 'one', 'fresh entry survives a reload');
  assert.equal(count(`${A}/profile`), 1);
  assert.ok(deleted.includes('KdlCreatorOverviewCache'), 'the old creator overview database is dropped');

  // Origins are isolated (the key holds the absolute URL)
  reply = () => ({ response: { id: '1', name: 'two' } });
  assert.equal((await api.apiGet('https://two.example/api/v1/patreon/user/1/profile')).name, 'two');

  // TTL expiry + stale-while-revalidate: profile is fresh for 6 h, then served stale while it refreshes
  now += 6 * HOUR + 1;
  const updates = [];
  reply = () => ({ response: { id: '1', name: 'renamed' } });
  const stale = await api.apiGet(`${A}/profile`, { onUpdate: (data) => updates.push(data.name) });
  assert.equal(stale.name, 'one', 'stale entry answers at once');
  await flush();
  assert.equal(count(`${A}/profile`), 2, 'one background refresh');
  assert.deepEqual(updates, ['renamed'], 'listener hears about changed data');
  assert.equal((await api.apiGet(`${A}/profile`)).name, 'renamed', 'refreshed entry is served');
  assert.equal(count(`${A}/profile`), 2);

  // Same answer on refresh: no notification
  now += 6 * HOUR + 1;
  const quiet = [];
  await api.apiGet(`${A}/profile`, { onUpdate: () => quiet.push(1) });
  await flush();
  assert.equal(count(`${A}/profile`), 3);
  assert.deepEqual(quiet, [], 'unchanged data does not notify');

  // allowStale: false waits for the network once the TTL ran out
  now += 6 * HOUR + 1;
  reply = () => ({ response: { id: '1', name: 'strict' } });
  assert.equal((await api.apiGet(`${A}/profile`, { allowStale: false })).name, 'strict');
  assert.equal(count(`${A}/profile`), 4);

  // Past the stale window an entry is not served at all
  now += 6 * HOUR + 8 * 24 * HOUR;
  reply = () => ({ response: { id: '1', name: 'new week' } });
  assert.equal((await api.apiGet(`${A}/profile`)).name, 'new week');
  assert.equal(count(`${A}/profile`), 5);

  // Failed and malformed answers are never stored
  reply = () => new Error('HTTP Status 500');
  await assert.rejects(api.apiGet(`${A}/links`));
  await assert.rejects(api.apiGet(`${A}/links`));
  assert.equal(count(`${A}/links`), 2, 'errors are not cached');
  reply = () => ({ response: null, responseText: '<html>Cloudflare</html>' });
  assert.equal(await api.apiGet(`${A}/links`), null, 'a non-JSON answer is handed back as the host gave it');
  await api.apiGet(`${A}/links`);
  assert.equal(count(`${A}/links`), 4, 'non-JSON answers are not cached');
  reply = () => ({ response: [{ error: 'unavailable' }] });
  const validLinks = (data) => Array.isArray(data) && data.every((row) => typeof row.service === 'string');
  await api.apiGet(`${A}/links`, { validate: validLinks });
  await api.apiGet(`${A}/links`, { validate: validLinks });
  assert.equal(count(`${A}/links`), 6, 'answers the validator rejects are not cached');

  // AdGuard: a JSON answer that arrives as text is parsed and cached
  reply = () => ({ response: '[{"tag":"cat","post_count":3}]', responseText: '[{"tag":"cat","post_count":3}]' });
  assert.deepEqual(await api.apiGet(`${A}/tags`), [{ tag: 'cat', post_count: 3 }]);
  assert.deepEqual(await api.apiGet(`${A}/tags`), [{ tag: 'cat', post_count: 3 }]);
  assert.equal(count(`${A}/tags`), 1, 'text JSON is normalized before caching');

  // Empty lists: kept 5 minutes only and never served stale
  reply = () => ({ response: [] });
  await api.apiGet(`${A}/announcements`);
  now += 4 * MIN;
  await api.apiGet(`${A}/announcements`);
  assert.equal(count(`${A}/announcements`), 1, 'empty list kept briefly');
  now += 2 * MIN;
  await api.apiGet(`${A}/announcements`);
  assert.equal(count(`${A}/announcements`), 2, 'empty list expires after 5 minutes, refetched in the foreground');

  // Session-dependent answers are never stored, only shared while in flight
  const FAV = 'https://one.example/api/v1/account/favorites?type=artist';
  reply = () => ({ response: [{ id: 'x', service: 'patreon' }] });
  await Promise.all([api.apiGet(FAV, { session: true }), api.apiGet(FAV, { session: true })]);
  assert.equal(count(FAV), 1, 'in-flight session requests are shared');
  await api.apiGet(FAV, { session: true });
  assert.equal(count(FAV), 2, 'session answers are not cached');
  const OTHER = 'https://one.example/api/v1/patreon/user/9/profile';
  await api.apiGet(OTHER, { session: true });
  await api.apiGet(OTHER, { session: true });
  assert.equal(count(OTHER), 2, 'the session flag bypasses storage for any URL');

  // Off: every call goes to the network and existing entries are ignored
  settings.apiCacheLifetime = 'off';
  await api.apiGet(`${A}/tags`);
  await api.apiGet(`${A}/tags`);
  assert.equal(count(`${A}/tags`), 3, 'off disables the cache');
  settings.apiCacheLifetime = 'normal';
  await api.apiGet(`${A}/tags`);
  assert.equal(count(`${A}/tags`), 3, 'entries stay usable when the cache is turned back on');

  // Short: a quarter of every TTL (overview 12 h -> 3 h)
  settings.apiCacheLifetime = 'short';
  now += 3 * HOUR + 1;
  await api.apiGet(`${A}/tags`, { allowStale: false });
  assert.equal(count(`${A}/tags`), 4, 'short lifetime expires sooner');
  settings.apiCacheLifetime = 'normal';

  // Abort: a caller's signal ends only its own wait; the request still lands in the cache
  let releaseRec;
  reply = () => new Promise((resolve) => { releaseRec = () => resolve({ response: [{ service: 'patreon', id: '2' }] }); });
  const controller = new AbortController();
  const aborted = api.apiGet(`${A}/recommended`, { signal: controller.signal });
  const patient = api.apiGet(`${A}/recommended`);
  await flush();
  controller.abort();
  await assert.rejects(aborted, (error) => error.name === 'AbortError');
  releaseRec();
  assert.equal((await patient).length, 1);
  await api.apiGet(`${A}/recommended`);
  assert.equal(count(`${A}/recommended`), 1, 'aborting one caller does not cancel or skip caching');

  // Invalidation: matching entries are dropped from both tiers, others stay
  reply = () => ({ response: { id: '1', title: 'post' } });
  await api.apiGet(`${A}/post/5`);
  await flush();
  await api.invalidateApiCache((url) => url.includes('/user/1/profile') || url.includes('/post/5'));
  await api.apiGet(`${A}/post/5`);
  assert.equal(count(`${A}/post/5`), 2, 'invalidated post is fetched again');
  const profileCalls = count(`${A}/profile`);
  await api.apiGet(`${A}/profile`);
  assert.equal(count(`${A}/profile`), profileCalls + 1, 'invalidated profile is fetched again');
  await api.apiGet(`${A}/recommended`);
  assert.equal(count(`${A}/recommended`), 1, 'unrelated entries survive');
  await flush();
  api = load();
  await api.apiGet(`${A}/recommended`);
  assert.equal(count(`${A}/recommended`), 1, 'unrelated entries survive in IndexedDB too');

  // An answer in flight during an invalidation is not stored
  let releaseLate;
  reply = () => new Promise((resolve) => { releaseLate = () => resolve({ response: { id: '1', title: 'old' } }); });
  const late = api.apiGet(`${A}/post/6`);
  await flush();
  await api.invalidateApiCache((url) => url.includes('/post/6'));
  releaseLate();
  await late;
  reply = () => ({ response: { id: '1', title: 'new' } });
  assert.equal((await api.apiGet(`${A}/post/6`)).title, 'new', 'in-flight answer from before the invalidation is dropped');

  // Clear: generation guard, stats
  await flush();
  assert.ok((await api.getApiCacheStats()).count > 0);
  let releaseOld;
  reply = () => new Promise((resolve) => { releaseOld = () => resolve({ response: [{ content: 'old' }] }); });
  const old = api.apiGet(`${A}/announcements?x=1`);
  await flush();
  await api.clearApiCache();
  releaseOld();
  assert.deepEqual(await old, [{ content: 'old' }], 'callers still get their answer');
  reply = () => ({ response: [{ content: 'new' }] });
  assert.deepEqual(await api.apiGet(`${A}/announcements?x=1`), [{ content: 'new' }], 'a request from before the clear cannot repopulate it');
  await flush();
  const stats = await api.getApiCacheStats();
  assert.equal(stats.count, 1, 'stats count entries');
  assert.ok(stats.totalSizeBytes > 0, 'stats measure bytes');

  // Eviction: entry budget (1000) keeps the newest, expired entries go, oversize answers are never stored
  await api.clearApiCache();
  reply = (details) => ({ response: { id: details.url } });
  for (let i = 0; i < 1010; i++) { now += 1; await api.apiGet(`https://one.example/api/v1/patreon/user/${i}/profile`); }
  await flush();
  now += 5000;
  runTimers();
  await flush();
  assert.equal(stores.meta.size, 1000, 'entry budget enforced in IndexedDB');
  assert.equal(stores.responses.size, 1000);
  assert.ok(!stores.meta.has('GET https://one.example/api/v1/patreon/user/0/profile'), 'oldest entries evicted first');
  assert.ok(stores.meta.has('GET https://one.example/api/v1/patreon/user/1009/profile'));
  // Memory LRU holds 200: an early key comes from IndexedDB again (still no network)
  const before = calls.length;
  await api.apiGet('https://one.example/api/v1/patreon/user/500/profile');
  assert.equal(calls.length, before, 'evicted from memory, still served from IndexedDB');
  // Byte budget (16 MB) and per-item cap (1 MB)
  await api.clearApiCache();
  const big = 'x'.repeat(450 * 1024); // ~900 KB as UTF-16
  reply = () => ({ response: { big } });
  for (let i = 0; i < 20; i++) { now += 1; await api.apiGet(`https://one.example/api/v1/patreon/user/${i}/post/1`); }
  reply = () => ({ response: { big: big + big } });
  await api.apiGet('https://one.example/api/v1/patreon/user/huge/post/1');
  await flush();
  now += 5000;
  runTimers();
  await flush();
  const bytes = [...stores.meta.values()].reduce((sum, item) => sum + item.size, 0);
  assert.ok(bytes <= 16 * 1024 * 1024, `byte budget enforced (${bytes})`);
  assert.ok(stores.meta.size < 20, 'oldest large entries evicted');
  assert.ok(!stores.meta.has('GET https://one.example/api/v1/patreon/user/huge/post/1'), 'answers over 1 MB are not stored');
  // Expired entries are removed by eviction
  await api.clearApiCache();
  reply = () => ({ response: [{ service: 'a', id: '1' }] });
  await api.apiGet(`${A}/posts?o=0`);
  now += 2 * HOUR; // creator posts: 10 min fresh + 1 h stale
  reply = () => ({ response: { id: 'p' } });
  await api.apiGet(`${A}/profile`);
  await flush();
  now += 5000;
  runTimers();
  await flush();
  assert.ok(!stores.meta.has(`GET ${A}/posts?o=0`), 'expired entries are evicted');
  assert.ok(stores.meta.has(`GET ${A}/profile`));

  // A broken IndexedDB never blocks: network + memory still work
  dbBroken = true;
  api = load();
  reply = () => ({ response: { id: 'z' } });
  const zUrl = 'https://one.example/api/v1/patreon/user/z/profile';
  assert.equal((await api.apiGet(zUrl)).id, 'z');
  await api.apiGet(zUrl);
  assert.equal(count(zUrl), 1, 'memory tier works without IndexedDB');
  assert.equal((await api.getApiCacheStats()).count, 1, 'stats fall back to memory');

  console.log('api cache checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
