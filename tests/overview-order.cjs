const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('src/modules/creatorOverview/order.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const storage = new Map();
const listeners = new Map();
const registryListeners = new Set();
let editMode = false;
function setEditMode(value) {
  editMode = value;
  registryListeners.forEach(fn => fn({ type: 'setting', id: 'creator.blockOrder', key: 'editMode', value }));
}
let target = null;
const doc = {
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
  elementFromPoint: () => target,
};
function makeNode(id) {
  const events = {};
  const head = { children: [], append(node) { this.children.push(node); } };
  const node = { id, events, head, parentElement: null,
    querySelector: () => head, contains: child => child === node,
    setAttribute() {}, removeAttribute() {}, getBoundingClientRect: () => ({ top: 0, height: 100 }),
    get nextSibling() { const siblings = this.parentElement?.children || []; return siblings[siblings.indexOf(this) + 1] || null; } };
  return node;
}
function button(options) { return { options, events: {}, disabled: false, addEventListener(name, fn) { this.events[name] = fn; }, focus() {} }; }
const imports = {
  '../../state/gmStorage': { readStored: key => storage.get(key), writeStored: (key, value) => storage.set(key, [...value]) },
  '../../ui/kit': { button, kitScope: children => ({ children, remove() { this.removed = true; } }) },
  '../../i18n': { t: (key, params) => `${key}:${params.section}` },
  '../../core/registry': { getModuleSetting: () => editMode, onRegistryChange: fn => { registryListeners.add(fn); return () => registryListeners.delete(fn); } },
};
const context = { exports: {}, require: id => imports[id], document: doc };
vm.runInNewContext(compiled, context);
const { normalizeOrder, moveSection, orderOverviewSections } = context.exports;
const plain = array => Array.from(array);
assert.deepEqual(plain(normalizeOrder(['links', 'links', 'invalid'])), ['links', 'announcements', 'tags']);
assert.deepEqual(plain(moveSection(['announcements', 'tags', 'links'], 'links', 'announcements', false)), ['links', 'announcements', 'tags']);
const nodes = ['announcements', 'tags', 'links'].map(makeNode);
const sections = nodes.map(node => ({ id: node.id, node, title: node.id }));
const root = { children: [...nodes], insertBefore(node, ref) {
  this.children.splice(this.children.indexOf(node), 1);
  const index = ref ? this.children.indexOf(ref) : -1;
  this.children.splice(index < 0 ? this.children.length : index, 0, node);
} };
nodes.forEach(node => { node.parentElement = root; });
const controller = orderOverviewSections(sections);
assert.deepEqual(plain(controller.nodes.map(node => node.id)), ['announcements', 'tags', 'links']);
const controls = nodes.map(node => node.head.children[0].children);
assert.equal(nodes[0].head.children[0].hidden, true, 'controls are hidden outside edit mode');
controls[2][0].options.onClick();
assert.deepEqual(root.children.map(node => node.id), ['announcements', 'tags', 'links'], 'disabled mode prevents reordering');
setEditMode(true);
assert.equal(nodes[0].head.children[0].hidden, false, 'enabling edit mode shows controls immediately');
controls[2][0].options.onClick();
assert.deepEqual(root.children.map(node => node.id), ['announcements', 'links', 'tags'], 'keyboard move updates the DOM');
assert.deepEqual(storage.get('creatorOverview.order'), ['announcements', 'links', 'tags']);
controls[2][2].events.pointerdown({ button: 0, pointerId: 7, preventDefault() {} });
target = nodes[0];
listeners.get('pointermove')({ pointerId: 7, clientX: 10, clientY: 10 });
assert.deepEqual(root.children.map(node => node.id), ['links', 'announcements', 'tags'], 'touch drag moves a section');
setEditMode(false);
assert.equal(listeners.size, 0, 'disabling edit mode cancels an active drag');
assert.equal(nodes[0].head.children[0].hidden, true, 'disabling edit mode hides controls immediately');
controller.cleanup();
assert.equal(listeners.size, 0, 'cleanup cancels an active drag');
const reloaded = orderOverviewSections(sections);
assert.deepEqual(plain(reloaded.nodes.map(node => node.id)), ['links', 'announcements', 'tags'], 'saved order survives remount');
assert.equal(nodes[0].head.children.at(-1).hidden, true, 'controls stay hidden on remount');
reloaded.cleanup();
const [recommended, top, grid, bottom] = ['recommended', 'top', 'grid', 'bottom'].map(makeNode);
const groupRoot = { children: [recommended, top, grid, bottom], insertBefore: root.insertBefore };
groupRoot.children.forEach(node => { node.parentElement = groupRoot; });
const groupController = orderOverviewSections([
  { id: 'recommended', node: recommended, title: 'Recommended' },
  { id: 'posts', node: grid, title: 'Posts', members: [top, grid, bottom] },
], { key: 'group', defaults: ['recommended', 'posts'], heading: '.heading' });
setEditMode(true);
grid.head.children[0].children[0].options.onClick();
assert.deepEqual(groupRoot.children.map(node => node.id), ['top', 'grid', 'bottom', 'recommended'], 'moving posts keeps both paginators together');
groupController.cleanup();
assert.equal(registryListeners.size, 0, 'cleanup removes edit mode subscriptions');
console.log('overview block ordering checks passed');
