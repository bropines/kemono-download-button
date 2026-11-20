const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/modules/pageBlocks/post.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
let cleanupCount = 0;
let queued = null;
class FakeElement {
  constructor(id, section = true) { this.id = id; this.parentElement = null; this.classList = { contains: value => section && value === 'kui-post-section' }; }
  querySelector(selector) { if (selector === ':scope > h2') return { textContent: this.id }; return selector.includes(this.id) ? {} : null; }
  matches() { return false; }
  before(node) { this.parentElement.insertBefore(node, this); }
}
class Marker {
  constructor() { this.parentElement = null; }
  get isConnected() { return !!this.parentElement; }
  after(node) { this.parentElement.insertBefore(node, this.nextSibling); }
  get nextSibling() { const children = this.parentElement.childNodes; return children[children.indexOf(this) + 1] || null; }
  remove() { if (this.parentElement) { const p = this.parentElement; p.childNodes.splice(p.childNodes.indexOf(this), 1); this.parentElement = null; } }
}
const root = {
  childNodes: [],
  get children() { return this.childNodes.filter(node => node instanceof FakeElement); },
  insertBefore(node, ref) {
    if (node.parentElement) { const old = node.parentElement.childNodes; old.splice(old.indexOf(node), 1); }
    const index = ref ? this.childNodes.indexOf(ref) : -1;
    this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, node);
    node.parentElement = this;
  },
};
const first = new FakeElement('attachments');
const second = new FakeElement('content');
const foreign = new FakeElement('site-widget', false);
root.insertBefore(first, null);
root.insertBefore(foreign, null);
root.insertBefore(second, null);
const imports = {
  '../../ui/kit': { ensureKit() {} },
  '../creatorOverview/order': { orderOverviewSections: sections => ({ nodes: sections.map(s => s.node).reverse(), cleanup: () => cleanupCount++ }) },
  '../../core/registry': { getModuleSetting: () => false, onRegistryChange: () => () => {} },
};
const location = { pathname: '/post/1' };
const context = { exports: {}, require: id => imports[id], HTMLElement: FakeElement, location,
  document: { documentElement: { toggleAttribute() {}, removeAttribute() {} }, querySelector: () => root, createComment: () => new Marker() },
  setTimeout: fn => { queued = fn; return 1; }, clearTimeout: () => { queued = null; },
};
vm.runInNewContext(compiled, context);
const moduleUnderTest = context.exports.postBlocksModule;
const ctx = { onCleanup() {} };
moduleUnderTest.mount(ctx);
assert.deepEqual(root.children.map(node => node.id), ['content', 'site-widget', 'attachments']);
moduleUnderTest.update();
assert.equal(cleanupCount, 0, 'router updates do not repeatedly rebuild controls');
moduleUnderTest.beforeSnapshot();
assert.deepEqual(root.children.map(node => node.id), ['attachments', 'site-widget', 'content'], 'snapshot restores native order and retains site widgets');
assert.equal(cleanupCount, 1);
queued();
assert.deepEqual(root.children.map(node => node.id), ['content', 'site-widget', 'attachments'], 'live page restores chosen order');
moduleUnderTest.beforeSnapshot();
moduleUnderTest.unmount();
assert.equal(queued, null, 'unmount cancels delayed restoration');
assert.deepEqual(root.children.map(node => node.id), ['attachments', 'site-widget', 'content']);
assert.equal(root.childNodes.length, 3, 'markers are removed');
moduleUnderTest.mount(ctx);
assert.deepEqual(root.children.map(node => node.id), ['content', 'site-widget', 'attachments'], 're-enabling restores saved order');
moduleUnderTest.unmount();
assert.deepEqual(root.children.map(node => node.id), ['attachments', 'site-widget', 'content'], 'disabling restores native order');
console.log('post block snapshot checks passed');
