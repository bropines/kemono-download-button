const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, imports, extra = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(`Unexpected import ${id}`); return imports[id]; }, ...extra };
  vm.runInNewContext(js, sandbox);
  return sandbox;
}

const links = [];
let opened = false;
const ui = load('src/ui/components/directDownloadFallback.ts', {
  '../../i18n': { t: key => key },
  '../../utils/cssBuilder': { css: () => '' },
  '../../utils/pawchiveRateLimit': { isPawchiveFile: url => url.startsWith('https://file.pawchive.pw/data/') },
  '../kit': {
    addKitStyles() {},
    button: options => { links.push(options); return options; },
    scrollArea: options => options,
    dialog: options => ({ open: () => { opened = true; }, options }),
  },
});
ui.exports.showDirectDownloadFallback([
  { url: 'https://file.pawchive.pw/data/first', fileName: 'folder/first.png' },
  { url: 'javascript:alert(1)', fileName: 'unsafe' },
]);
assert.equal(opened, true);
assert.equal(links.length, 1, 'only eligible file URLs are offered');
assert.equal(links[0].href, 'https://file.pawchive.pw/data/first');
assert.equal(links[0].target, '_blank');
assert.equal(links[0].download, 'first.png');
assert.equal(links[0].onClick, undefined, 'links rely on an explicit user click');

const offered = [], history = [], tasks = [];
const file = (name, data) => ({ source: 'url', isMedia: true, isAttachment: true, name, data });
const files = [file('first.png', 'first'), file('second.png', 'second'), file('third.png', 'third')];
let result = { first: 200, second: 403, third: 500 };
const request = async url => {
  const status = result[url];
  if (status !== 200) { const error = Error('failed'); error.status = status; throw error; }
  return { response: new ArrayBuffer(2) };
};
const store = { settings: { maxConcurrentIndividualDownloads: 2, skipDownloadedFiles: false }, cachedPostFiles: files };
const impl = load('src/services/downloadService.ts', {
  './cacheService': { getCachedFile: async () => null, setCachedFile: async () => {} },
  '../utils/saveFile': { saveBlob() {} }, './zipBuilder': {},
  '../ui/progressManager': { progressManager: { createTask: () => {
    const task = { signal: new AbortController().signal, states: [], failed: null, addFile() {}, setTotal() {}, updateFileProgress() {},
      updateStatus(s) { this.states.push(s); }, markFileComplete(_id, ok) { this.states.push(ok ? 'success' : 'error'); },
      fail(s) { this.failed = s; }, finish() {} };
    tasks.push(task); return task;
  } } },
  '../ui/toast': {}, '../ui/components/fixedControls': {},
  '../state/store': { appState: store, state: store, getSettings: async () => {} },
  '../utils/helpers': { debugLog() {}, sanitizeFilename: s => s, generateRandomId: () => '1' },
  '../utils/http': { downloadFileWithFallback: async url => { await request(url); }, gmXmlhttpRequestWithRetries: async ({url}) => request(url), isAbortError: e => e?.name === 'AbortError' },
  './collectorService': {}, './queueService': {},
  './downloadHistory': { dropDownloaded: async items => ({ items, skipped: 0 }), recordDownloaded: url => history.push(url), flushDownloadHistory: async () => {} },
  '../i18n': { t: key => key },
  '../utils/pawchiveRateLimit': { isPawchiveFile: url => url === 'second' },
  '../ui/components/directDownloadFallback': { showDirectDownloadFallback: entries => offered.push(entries.map(x => x.url).join(',')) },
}, { window: { location: { pathname: '/user/post/1' } }, console: { error() {} }, ArrayBuffer, Blob, AbortController });

(async () => {
  const post = { postID: '1', postTitle: 'Test' };
  await impl.exports.executeIndividualDownload('Images', post);
  assert.equal(offered.join('|'), 'second', 'only rejected Pawchive files get fallback links');
  assert.equal(history.join(','), 'first', 'failed files are not recorded as downloaded');
  assert.ok(tasks[0].states.includes('error'));

  await impl.exports.downloadFilesToDiskWithProgress(files.map(f => ({ url: f.data, fileName: f.name })), 'files');
  assert.equal(offered.join('|'), 'second|second', 'file picker uses the same fallback');
  assert.equal(history.join(','), 'first,first');

  impl.GM_download = () => {};
  await impl.exports.executeIndividualDownload('Images', post);
  assert.equal(offered.length, 2, 'other userscript managers do not get the AdGuard fallback');
  console.log('direct download fallback checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
