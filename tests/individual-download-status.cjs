const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/services/downloadService.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const runs = [];
const history = [];
const state = { settings: { maxConcurrentIndividualDownloads: 2, skipDownloadedFiles: false } };
const appState = { cachedPostFiles: [
  { source: 'url', isMedia: true, name: 'ok.png', data: 'ok' },
  { source: 'url', isMedia: true, name: 'bad.png', data: 'bad' },
] };
let failing = new Set();
const imports = {
  './cacheService': {}, '../utils/saveFile': {}, './zipBuilder': {},
  '../ui/progressManager': { progressManager: { createTask: () => {
    const run = { statuses: [], failed: null, files: [], signal: new AbortController().signal,
      updateStatus(text) { this.statuses.push(text); }, addFile() {}, setTotal() {},
      markFileComplete(id, ok) { this.files.push({ id, ok }); },
      fail(text) { this.failed = text; }, finish() {} };
    runs.push(run); return run;
  } } },
  '../ui/toast': {}, '../ui/components/fixedControls': {},
  '../state/store': { appState, state, getSettings: async () => {} },
  '../utils/helpers': {},
  '../utils/http': { downloadFileWithFallback: async url => { if (failing.has(url)) { const error = Error('HTTP 403'); error.status = 403; throw error; } }, isAbortError: e => e?.name === 'AbortError' },
  './collectorService': {}, './queueService': {},
  './downloadHistory': { dropDownloaded: async items => ({ items, skipped: 0 }), recordDownloaded: value => history.push(value), flushDownloadHistory: async () => {} },
  '../i18n': { t: (key, args) => `${key}:${JSON.stringify(args ?? {})}` },
  '../utils/pawchiveRateLimit': { isPawchiveFile: url => url === 'bad' },
  '../ui/components/directDownloadFallback': { showDirectDownloadFallback: () => {} },
};
const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; },
  window: { location: { pathname: '/creator/post/1' } }, console: { error() {} } };
vm.runInNewContext(compiled, sandbox);
const download = sandbox.exports.executeIndividualDownload;
const post = { postID: '1', postTitle: 'Test' };

(async () => {
  failing = new Set(['ok', 'bad']);
  await download('Images', post);
  assert.match(runs[0].failed, /dl\.task\.doneSummary:.*"ok":0.*"failed":2/);
  assert.match(runs[0].failed, /dl\.task\.pawchiveForbidden/);
  assert.equal(history.length, 0, 'failed downloads are never recorded');
  assert.equal(runs[0].statuses.some(s => s.includes('allTriggered')), false);

  failing = new Set(['bad']);
  await download('Images', post);
  assert.equal(runs[1].failed, null, 'partial failure remains a partial task');
  assert.match(runs[1].statuses.at(-1), /dl\.task\.doneSummary:.*"ok":1.*"failed":1/);
  assert.match(runs[1].statuses.at(-1), /dl\.task\.pawchiveForbidden/);
  assert.equal(history.join(','), 'ok');

  failing = new Set();
  await download('Images', post);
  assert.match(runs[2].statuses.at(-1), /dl\.task\.allTriggered/);
  console.log('individual download status checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
