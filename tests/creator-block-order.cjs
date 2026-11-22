const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/modules/pageBlocks/creator.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
class Element {
  constructor(name, cls = '', id = '') { this.name = name; this.className = cls; this.id = id; this.parentElement = null; this.childNodes = []; }
  get children() { return this.childNodes.filter(x => x instanceof Element && !(x instanceof Marker)); }
  get nextElementSibling() { const arr = this.parentElement?.children || []; return arr[arr.indexOf(this) + 1] || null; }
  get nextSibling() { const arr = this.parentElement?.childNodes || []; return arr[arr.indexOf(this) + 1] || null; }
  get isConnected() { return !!this.parentElement; }
  matches(selector) { if (selector === ':scope > .tabs') return false; return selector.startsWith('#') ? this.id === selector.slice(1) : this.className.split(' ').includes(selector.slice(1)); }
  querySelector(selector) { if (selector === ':scope > .tabs') return this.children.find(x => x.matches('.tabs')) || null; return this.children.find(x => x.matches(selector)) || null; }
  before(node) { this.parentElement.insertBefore(node, this); }
  after(...nodes) { const parent = this.parentElement; nodes.forEach(node => node.remove()); const ref = this.nextSibling; nodes.forEach(node => parent.insertBefore(node, ref)); }
  prepend(node) { this.insertBefore(node, this.childNodes[0] || null); }
  append(node) { this.insertBefore(node, null); }
  insertBefore(node, ref) { if (node.parentElement) { const old = node.parentElement.childNodes; old.splice(old.indexOf(node), 1); } const i = ref ? this.childNodes.indexOf(ref) : -1; this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, node); node.parentElement = this; }
  remove() { if (this.parentElement) { const list = this.parentElement.childNodes; list.splice(list.indexOf(this), 1); this.parentElement = null; } }
}
class Marker extends Element { constructor() { super('marker'); } }
const root = new Element('root');
const sim = new Element('similar', 'kdl-sim');
sim.append(new Element('sim-header', 'kdl-sim__head'));
const overview = new Element('overview', 'kdl-ov');
const top = new Element('top', 'paginator', 'paginator-top');
const cards = new Element('cards', 'card-list');
const bottom = new Element('bottom', 'paginator', 'paginator-bottom');
const foreign = new Element('foreign', 'site-widget');
[sim, overview, foreign, top, cards, bottom].forEach(node => root.append(node));
let cleanups = 0, queued = null, listener = null;
const doc = { documentElement: { toggleAttribute() {}, removeAttribute() {} }, querySelector: () => root, createComment: () => new Marker(),
  addEventListener: (_event, fn) => { listener = fn; }, removeEventListener: () => { listener = null; } };
const imports = {
  '../../utils/dom': { el: (_tag, props) => new Element('heading', props.className || '') },
  '../../ui/kit': { ensureKit() {} },
  '../../i18n': { t: key => key },
  '../../core/registry': { getModuleSetting: () => false, onRegistryChange: () => () => {} },
  '../creatorOverview/order': { orderOverviewSections: groups => ({ nodes: [...groups].sort((a, b) => ['posts', 'overview', 'similar'].indexOf(a.id) - ['posts', 'overview', 'similar'].indexOf(b.id)).map(group => group.node), cleanup: () => cleanups++ }) },
};
const location = { pathname: '/fanbox/user/1' };
const context = { exports: {}, require: id => imports[id], document: doc, location,
  setTimeout: fn => { queued = fn; return 1; }, clearTimeout: () => { queued = null; } };
vm.runInNewContext(compiled, context);
const moduleUnderTest = context.exports.creatorBlocksModule;
let cleanup;
moduleUnderTest.mount({ onCleanup: fn => { cleanup = fn; } });
const names = () => root.children.map(node => node.name);
// The site's own nodes (the posts group, a foreign widget) are never moved: our blocks go around the posts
assert.deepEqual(names(), ['foreign', 'top', 'cards', 'bottom', 'overview', 'similar'], 'our blocks are placed around the posts, which stay where the site put them');
moduleUnderTest.update();
assert.equal(cleanups, 0, 'unchanged sections do not rebuild');
moduleUnderTest.beforeSnapshot();
assert.deepEqual(names(), ['foreign', 'similar', 'overview', 'top', 'cards', 'bottom'], 'HTMX snapshot receives the site order, our blocks above the posts');
listener();
assert.deepEqual(names(), ['foreign', 'similar', 'overview', 'top', 'cards', 'bottom'], 'section events are suspended during the snapshot');
queued();
assert.deepEqual(names(), ['foreign', 'top', 'cards', 'bottom', 'overview', 'similar']);
overview.remove();
listener();
assert.deepEqual(names(), ['foreign', 'top', 'cards', 'bottom', 'similar'], 'removing an asynchronously loaded block rebuilds safely');
// A block that arrives later is put in its place; nothing that is already in place is taken out and put back
const moved = [];
const insert = root.insertBefore.bind(root);
root.insertBefore = (node, ref) => { if (node instanceof Element && !(node instanceof Marker)) moved.push(node.name); return insert(node, ref); };
root.append(overview);
moved.length = 0;
listener();
assert.deepEqual(names(), ['foreign', 'top', 'cards', 'bottom', 'overview', 'similar'], 'a block added later receives controls and saved ordering');
assert.ok(moved.length === 1 && !moved.some(name => ['top', 'cards', 'bottom', 'foreign'].includes(name)), 'one of our blocks is moved: the cards and paginators stay in the page');
delete root.insertBefore;
cleanup();
assert.deepEqual(names(), ['foreign', 'similar', 'overview', 'top', 'cards', 'bottom'], 'disable restores the site order, our blocks above the posts');
assert.equal(root.childNodes.length, 6, 'no marker remains');
assert.equal(overview.children.length, 0, 'injected heading is removed');
assert.equal(cards.children.length, 0, 'post heading is removed');

// The live search puts its "Load more" box between the cards and the bottom paginator: it stays with the posts.
moduleUnderTest.mount({ onCleanup: fn => { cleanup = fn; } });
const more = new Element('more', 'kdl-live-search-more', 'kdl-live-search-more');
cards.after(more);
listener();
assert.deepEqual(names().filter(n => n !== 'heading'), ['foreign', 'top', 'cards', 'more', 'bottom', 'overview', 'similar'], 'live search box stays with the posts group');
cleanup();
more.remove();

// Until the skin lifts the creator tabs out of the top paginator, the posts group is left where it is.
const tabs = new Element('tabs', 'tabs');
top.append(tabs);
const posts = () => names().filter(n => n !== 'heading');
const beforeTabs = posts();
moduleUnderTest.mount({ onCleanup: fn => { cleanup = fn; } });
const withTabs = posts();
assert.deepEqual(withTabs.slice(withTabs.indexOf('top'), withTabs.indexOf('top') + 3), ['top', 'cards', 'bottom']);
assert.equal(withTabs.indexOf('top'), beforeTabs.indexOf('top'), 'the posts group is not moved while the tabs are inside it');
cleanup();
tabs.remove();
console.log('creator block snapshot checks passed');
