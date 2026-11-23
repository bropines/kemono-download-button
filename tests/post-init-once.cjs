const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const calls = { comments: 0, translation: 0 };
const classes = new Set();
const body = { classList: { contains: key => classes.has(key), add: key => classes.add(key) } };
const state = { isPostPageModuleActive: false };
const noop = () => {};
const imports = {
  '../../config/selectors': { SELECTORS: { postBody: 'body', postPageContainer: 'page', postContent: 'content' } },
  '../../state/kuiState': { kuiState: state },
  './embeds': { restructureLayout: () => classes.add('kui-processed'), processEmbeds: noop, hideEmptySections: noop },
  './imageGallery': { initializeImageGallery: noop },
  './videoGallery': { initializeVideoGallery: noop, destroyVideoGallery: noop },
  './comments': { initializeComments: () => calls.comments++, removeCommentsLayout: noop },
  './translateButtons': { initializePostTranslation: () => calls.translation++, removeTranslateButtons: noop },
  './lightbox': { lightboxModule: {} },
  '../../core/registry': { getModuleSetting: noop },
  './contentClamp': { contentClampStyles: '', initializeContentClamp: noop, removeContentClamp: noop, setContentClampLines: noop },
};
const source = fs.readFileSync('src/features/kui/postPageModule.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; },
  document: { querySelector: s => s === 'body' ? body : s === 'page' ? {} : null, documentElement: { removeAttribute: noop }, addEventListener: noop, removeEventListener: noop } };
vm.runInNewContext(js, sandbox);
const mod = sandbox.exports.kuiPostModule;
mod.mount({ settings: { get: () => false }, onCleanup: noop });
assert.deepEqual(calls, { comments: 1, translation: 1 }, 'initial mount processes comments and translations once');
mod.update();
assert.deepEqual(calls, { comments: 2, translation: 2 }, 'later updates still process late comments');
console.log('post initialization checks passed');
