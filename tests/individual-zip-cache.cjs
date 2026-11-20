const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/services/downloadService.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const cache = new Map();
const bytes = new Uint8Array([1, 2, 3]).buffer;
let zipFetches = 0;
const file = { source: 'url', isMedia: true, name: 'test.jpg', data: 'https://file.pawchive.pw/data/test' };
const task = () => ({ signal: new AbortController().signal, updateStatus() {}, setTotal() {}, addFile() {}, updateFileProgress() {}, markFileComplete() {}, fail(message) { throw Error(message); }, finish() {} });
class Zip { addFile(name, data) { assert.equal(data, bytes); return name; } async toBlob() { return new Blob(['zip']); } }
const imports = {
  './cacheService': { getCachedFile: async url => cache.get(url) || null, setCachedFile: async (url, data) => { cache.set(url, data); } },
  '../utils/saveFile': { saveBlob() {} }, './zipBuilder': { ZipBuilder: Zip },
  '../ui/progressManager': { progressManager: { createTask: task } }, '../ui/toast': {}, '../ui/components/fixedControls': {},
  '../state/store': { appState: { cachedPostFiles: [file] }, state: { settings: { maxConcurrentIndividualDownloads: 1, maxConcurrentFileDownloadsInZip: 1, ignoredFileExtensions: [], skipDownloadedFiles: false } }, getSettings: async () => {} },
  '../utils/helpers': { debugLog() {}, generateRandomId: () => 'id', sanitizeFilename: s => s, isFileExtensionIgnored: () => false },
  '../utils/http': { downloadFileWithFallback: async (_url, _name, _progress, _signal, onFetched) => { await onFetched(bytes); }, gmXmlhttpRequestWithRetries: async () => { zipFetches++; return { response: bytes }; }, isAbortError: () => false },
  './collectorService': {}, './queueService': {},
  './downloadHistory': { dropDownloaded: async items => ({ items, skipped: 0 }), recordDownloaded() {}, flushDownloadHistory: async () => {} },
  '../i18n': { t: key => key }, '../utils/pawchiveRateLimit': {}, '../ui/components/directDownloadFallback': {},
};
const sandbox = { exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; }, window: { location: { pathname: '/artist/post/1' } }, Blob, console };
vm.runInNewContext(compiled, sandbox);
(async () => {
  const post = { postID: '1', postTitle: 'Test', authorName: 'Author' };
  await sandbox.exports.executeIndividualDownload('Images', post);
  assert.equal(cache.get(file.data), bytes, 'individual request makes bytes available to the cache');
  await sandbox.exports.executeZipDownload(post);
  assert.equal(zipFetches, 0, 'ZIP reuses the individual download without another HTTP request');
  console.log('individual to ZIP cache checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
