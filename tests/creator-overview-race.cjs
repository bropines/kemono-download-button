const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual module with delayed API responses and repeated router updates.
const source = fs.readFileSync('src/modules/creatorOverview/index.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const blocks = [];
const requests = [];
const tagPromises = new Map();
let tagCalls = 0;
const anchor = { after(node) { node.remove(); node.isConnected = true; node.previousElementSibling = anchor; blocks.unshift(node); }, compareDocumentPosition: () => 4 };
function element(tag, attrs, children = []) {
  return { tag, attrs, children, isConnected: false, previousElementSibling: null,
    remove() { const index = blocks.indexOf(this); if (index >= 0) blocks.splice(index, 1); this.isConnected = false; },
    setAttribute() {}, toggleAttribute() {}, addEventListener() {} };
}
const api = {
  fetchAnnouncements: () => Promise.resolve([]),
  fetchCreatorLinks: () => Promise.resolve([]),
  fetchCreatorTags: (service, id) => {
    tagCalls++;
    const key = `${service}/${id}`;
    if (!tagPromises.has(key)) tagPromises.set(key, new Promise(resolve => requests.push(resolve)));
    return tagPromises.get(key);
  },
};
const imports = {
  '../../utils/dom': { el: element },
  '../../ui/kit': { ensureKit() {}, kitIcon: () => element('i', {}), kitScope: (children, attrs) => element('div', attrs, children), swapIn() {}, collapseAway(node, done) { node.remove(); if (done) done(); } },
  '../../api/kemonoApi': api,
  '../../i18n': { t: key => key },
  './order': { orderOverviewSections: sections => ({ nodes: sections.map(section => section.node), cleanup() {} }) },
  '../../core/registry': { getModuleSetting: () => true, isModuleEnabled: () => false },
  '../../i18n/site': { originalText: () => '' },
  '../../core/cloak': { holdCloak() {}, isCloaked: () => false },
  '../../state/store': { getSettings: () => Promise.resolve() },
};
const location = { pathname: '/fanbox/user/1', search: '' };
const context = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; },
  location, document: { querySelector: selector => selector === '.kdl-sim' || selector === 'header.user-header' ? anchor : null, dispatchEvent() {} }, Event: class {}, URLSearchParams, console };
vm.runInNewContext(compiled, context);
const moduleUnderTest = context.exports.creatorOverviewModule;
const listeners = {};
let cleanup;
const ctx = { settings: { get: () => true, onChange: (key, fn) => { listeners[key] = fn; } }, onCleanup: fn => { cleanup = fn; } };
const settle = () => new Promise(resolve => setImmediate(resolve));
const tags = [{ tag: 'sample', count: 1 }];

(async () => {
  moduleUnderTest.mount(ctx);
  for (let i = 0; i < 10; i++) moduleUnderTest.update(ctx);
  assert.equal(requests.length, 1, 'updates share the pending render');
  requests[0](tags);
  await settle();
  assert.equal(blocks.length, 1, 'only one overview appears');
  moduleUnderTest.update(ctx);
  assert.equal(blocks.length, 1);

  // A response from the first visit must not render during a later visit to the same URL.
  cleanup();
  location.pathname = '/fanbox/user/2';
  moduleUnderTest.mount(ctx);
  const old = requests.at(-1);
  cleanup();
  moduleUnderTest.mount(ctx);
  old(tags);
  await settle();
  assert.equal(blocks.length, 1, 'remount renders once even when an earlier request completes');

  // A snapshot or setting change invalidates an in-flight render.
  location.pathname = '/fanbox/user/3';
  moduleUnderTest.update(ctx);
  const snapshotRequest = requests.at(-1);
  moduleUnderTest.beforeSnapshot();
  snapshotRequest(tags);
  await settle();
  assert.equal(blocks.length, 0, 'snapshot cancels pending render');
  moduleUnderTest.update(ctx);
  await settle();
  assert.equal(blocks.length, 1, 'overview returns after snapshot');
  listeners.tags();
  moduleUnderTest.update(ctx);
  await settle();
  assert.equal(blocks.length, 1, 'setting changes do not duplicate the overview');
  cleanup();

  // A creator with nothing to show renders nothing, and later page mutations do not ask the API again.
  location.pathname = '/fanbox/user/4';
  moduleUnderTest.mount(ctx);
  requests.at(-1)([]);
  await settle();
  const before = tagCalls;
  await settle();
  assert.equal(blocks.length, 0, 'empty overview renders nothing');
  for (let i = 0; i < 5; i++) moduleUnderTest.update(ctx);
  await settle();
  assert.equal(tagCalls, before, 'an empty overview is not requested again on every update');
  cleanup();
  console.log('creator overview race checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
