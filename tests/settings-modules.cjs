const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, imports) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; } };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}
const { moduleTopic } = load('src/ui/settings/sections/moduleTopics.ts', {});
assert.equal(moduleTopic({ id: 'ui.shadcn', group: 'Interface' }), 'themes');
assert.equal(moduleTopic({ id: 'ui.shadcn.cards', group: 'Interface' }), 'themes');
assert.equal(moduleTopic({ id: 'restyle', group: 'Interface' }), 'themes');
assert.equal(moduleTopic({ id: 'downloader.post', group: 'Downloader' }), 'downloads');
assert.equal(moduleTopic({ id: 'creators.overview', group: 'Lists' }), 'interface');
assert.equal(moduleTopic({ id: 'core', group: 'General' }), null);
assert.equal(moduleTopic({ id: 'i18n.site', group: 'Interface' }), null);

function node(tag, props = {}, children = []) {
  const result = { tag, ...props, children: [], dataset: { ...(props.dataset || {}) }, classList: { add() {} },
    append(...items) { this.children.push(...items.filter(Boolean)); },
    get childElementCount() { return this.children.length; },
    querySelector(selector) {
      if (selector === '.kdl-settings__section-head') return this.header;
      if (selector === 'span') return this.children.find(child => child && child.tag === 'span');
      return null;
    },
  };
  result.append(...children);
  return result;
}
const listeners = [];
let enabled = true;
let registered;
const sample = { id: 'creators.overview', name: 'Overview', description: 'Description', group: 'Lists', pages: ['creator'] };
const getModules = () => [sample];
const setModuleEnabled = (_id, value) => {
  enabled = value;
  for (const listener of listeners) listener({ type: value ? 'enabled' : 'disabled', id: sample.id });
};
const kit = {
  badge: () => node('badge'), emptyState: () => node('empty'), field: () => node('field'), input: () => node('input'),
  kitIcon: () => node('icon'), select: () => node('select'), slider: () => node('slider'), textarea: () => node('textarea'),
  isSwitchOn: control => control.checked, setSwitch: (control, value) => { control.checked = value; }, setSliderValue() {},
  switchControl: options => ({ tag: 'switch', ...options, classList: { add() {} }, checked: options.checked,
    click() { this.onChange(!this.checked); } }),
};
const controls = {
  notifySaved() {},
  section: (_title, children) => { const card = node('section', {}, children); card.header = node('header'); card.append(card.header); return card; },
  whileConnected: (_node, listener) => listeners.push(listener),
};
const moduleUi = load('src/ui/settings/sections/modules.ts', {
  '../../../core': { getModule: id => id === sample.id ? sample : undefined, getModules, getModuleSetting() {}, isModuleEnabled: () => enabled, setModuleEnabled, setModuleSetting() {} },
  '../../../utils/dom': { el: node }, '../../kit': kit, '../controls': controls,
  '../registry': { getSettingsSections: () => [], registerSettingsSection: def => { registered = def; } },
  '../../../i18n': { t: key => key, tx: (_key, fallback) => fallback }, './moduleTopics': { moduleTopic },
});
const topicContainer = node('root');
moduleUi.renderTopicModules(topicContainer, 'interface');
const topicCard = topicContainer.children[0].children[1].children[0];
const topicSwitch = topicCard.header.children[0];
const catalogContainer = node('root');
registered.render(catalogContainer);
const catalogCard = catalogContainer.children[1].children[1];
const catalogSwitch = catalogCard.header.children[0];
assert.notEqual(topicSwitch.id, catalogSwitch.id, 'copies have distinct accessible IDs');
topicSwitch.click();
assert.equal(enabled, false);
assert.equal(topicSwitch.checked, false);
assert.equal(catalogSwitch.checked, false, 'catalogue follows a change in the topic');
catalogSwitch.click();
assert.equal(enabled, true);
assert.equal(topicSwitch.checked, true, 'topic follows a change in the catalogue');
console.log('settings module topic and synchronization checks passed');
