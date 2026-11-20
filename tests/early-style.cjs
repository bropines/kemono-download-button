const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, imports, globals = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; }, ...globals };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}

let applied = 0;
let transforms = 0;
const theme = load('src/modules/restyle/index.ts', {
  '../../core/registry': {},
  './apply': { applyThemeStyles: themes => { assert.equal(themes[0].id, 'enabled'); applied++; } },
  './store': { getEnabledThemes: () => [{ id: 'enabled' }] },
  './transforms': { syncTransforms: () => { transforms++; } },
  '../../ui/settings/sections/themes': {},
});
theme.restyleModule.early();
assert.equal(applied, 1, 'enabled theme CSS is applied during early boot');
assert.equal(transforms, 0, 'DOM transforms wait until mount');

let callbacks = new Map(), nextId = 0, events = [];
const location = { pathname: '/first' };
const { reversibleTransform } = load('src/modules/shadcnSite/reversibleTransform.ts', {}, {
  location,
  setTimeout: fn => { callbacks.set(++nextId, fn); return nextId; },
  clearTimeout: id => callbacks.delete(id),
});
const flush = () => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn()); };
const transform = reversibleTransform(() => events.push('apply'), () => events.push('undo'));
transform.mount();
transform.beforeSnapshot();
assert.deepEqual(events, ['apply', 'undo']);
flush();
assert.deepEqual(events, ['apply', 'undo', 'apply'], 'live layout returns after snapshot');
transform.beforeSnapshot();
transform.unmount();
flush();
assert.equal(events.at(-1), 'undo', 'unmount cancels restoration');
transform.mount();
transform.beforeSnapshot();
location.pathname = '/second';
flush();
assert.equal(events.at(-1), 'undo', 'navigation cancels restoration on the old page');
console.log('early theme and snapshot checks passed');
