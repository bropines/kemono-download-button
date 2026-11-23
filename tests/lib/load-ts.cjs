// Loads a tree of src/ TypeScript modules into one VM context ("a browser"): relative imports load the real
// files, except the paths given in `mocks` (keyed by path from the repo root, e.g. 'src/i18n/index.ts').
// GM_getValue / GM_setValue work on the `gm` Map, so each call of browser() starts with its own storage.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..', '..');

function resolve(from, id) {
  const base = path.resolve(path.dirname(from), id);
  for (const candidate of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`cannot resolve ${id} from ${from}`);
}

function browser({ mocks = {}, gm = new Map(), globals = {} } = {}) {
  const context = vm.createContext({
    console, Blob, URL, JSON, Date, Math, Promise, setTimeout, clearTimeout,
    GM_getValue: (key, fallback) => (gm.has(key) ? gm.get(key) : fallback),
    GM_setValue: (key, value) => { gm.set(key, value); },
    ...globals,
  });
  const cache = new Map();
  const mockFor = (file) => mocks[path.relative(ROOT, file).split(path.sep).join('/')];
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mock = mockFor(file);
    if (mock) return mock;
    const module = { exports: {} };
    cache.set(file, module);
    if (file.endsWith('.json')) {
      module.exports = JSON.parse(fs.readFileSync(file, 'utf8'));
      return module.exports;
    }
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const fn = vm.runInContext(`(function (exports, require, module) {${js}\n})`, context, { filename: file });
    fn(module.exports, (id) => {
      if (!id.startsWith('.')) throw new Error(`unexpected import ${id} in ${file}`);
      return load(resolve(file, id));
    }, module);
    return module.exports;
  }
  return { gm, context, require: (rel) => load(path.join(ROOT, rel)) };
}

module.exports = { browser, ROOT };
