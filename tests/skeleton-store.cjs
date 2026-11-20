const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const load = (file, context) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, ...context });
  return exports;
};

// Routes and screen classes (src/core/skeletonCapture.ts)
const capture = load('src/core/skeletonCapture.ts', { window: { innerWidth: 1200, location: { pathname: '/' } } });
const route = capture.skeletonRoute;
assert.equal(route('/'), 'home');
assert.equal(route('/posts'), 'posts');
assert.equal(route('/posts/popular'), 'posts-popular');
assert.equal(route('/artists/updated/'), 'artists-updated');
assert.equal(route('/fanbox/user/123'), 'creator');
assert.equal(route('/fanbox/user/123/announcements'), 'creator-announcements');
assert.equal(route('/patreon/user/9/post/77'), 'post');
assert.equal(route('/discord/server/1/2'), 'discord');
assert.equal(capture.skeletonBucket(390), 'mobile');
assert.equal(capture.skeletonBucket(720), 'mobile');
assert.equal(capture.skeletonBucket(721), 'desktop');

// Lookup order and capture bookkeeping (src/core/skeletonStore.ts)
const snap = (tag) => ({ v: 1, pad: [0, 0, 0], h: 10, shapes: [{ k: 't', x: [0, 0], w: [0, 10], y: 0, h: 5, r: 0, tag }] });
const broken = { v: 1, pad: [0, 0, 0], h: 10, shapes: [{ k: 't', y: 0, h: 5 }] };
const stored = new Map();
let writes = 0;
let captured = snap('fresh');
const timers = [];
const context = {
  window: { innerWidth: 1600, location: { pathname: '/fanbox/user/1/links' } },
  document: { documentElement: { hasAttribute: () => false } },
  setTimeout: (fn) => { timers.push(fn); return timers.length; },
  clearTimeout: () => {},
  requestIdleCallback: (fn) => fn(),
  require: (id) => {
    if (id === '../state/gmStorage') return {
      readStored: (key, fallback) => (stored.has(key) ? JSON.parse(stored.get(key)) : fallback),
      writeStored: (key, value) => { writes++; stored.set(key, JSON.stringify(value)); },
    };
    if (id === './skeletonCapture') return { captureSkeleton: () => captured, skeletonBucket: capture.skeletonBucket.bind(null, 1600), skeletonRoute: capture.skeletonRoute };
    if (id === './skeletons.json') return { default: { 'creator|desktop': snap('builtin-creator'), 'posts|desktop': snap('builtin-posts'), 'post|desktop': snap('builtin-post') } };
    throw Error(id);
  },
};
const store = load('src/core/skeletonStore.ts', context);
const tagOf = (s) => s && s.shapes[0].tag;

assert.equal(tagOf(store.snapshotFor('/fanbox/user/1/post/2')), 'builtin-post', 'a shipped snapshot for the route');
assert.equal(tagOf(store.snapshotFor('/fanbox/user/1/links')), 'builtin-creator', 'a creator tab falls back to the creator page');
assert.equal(tagOf(store.snapshotFor('/importer/status/abc')), 'builtin-posts', 'an unknown page falls back to the post list');

store.scheduleSkeletonCapture();
timers.shift()();
assert.equal(writes, 1, 'a settled page is captured');
assert.equal(tagOf(store.snapshotFor('/fanbox/user/1/links')), 'fresh', "the user's own snapshot wins over the shipped one");
store.scheduleSkeletonCapture();
timers.shift()();
assert.equal(writes, 1, 'an unchanged page is not written again');
captured = snap('changed');
store.scheduleSkeletonCapture();
context.window.location.pathname = '/elsewhere';
timers.shift()();
assert.equal(writes, 1, 'no capture after navigating away before it settled');
context.window.location.pathname = '/fanbox/user/1/links';
store.scheduleSkeletonCapture();
timers.shift()();
assert.equal(writes, 2, 'a changed layout replaces the stored snapshot');
assert.equal(tagOf(store.snapshotFor('/fanbox/user/1/links')), 'changed');

// A stored snapshot this build cannot draw is ignored, not thrown on
stored.set('skeleton.post.desktop', JSON.stringify(broken));
assert.equal(tagOf(store.snapshotFor('/fanbox/user/1/post/2')), 'builtin-post', 'a malformed stored snapshot falls back');

// No capture for addresses that are not a kind of page (ids in the path)
context.window.location.pathname = '/share/abc123';
const before = timers.length;
store.scheduleSkeletonCapture();
assert.equal(timers.length, before, 'an unknown kind of page is not captured');

console.log('skeleton store checks passed');
