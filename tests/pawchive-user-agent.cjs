const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts): http.ts imports it
const pageBody = (() => { const js = require('typescript').transpileModule(require('node:fs').readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

function load(path, imports, globals = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: id => { if (id === './pageBody') return pageBody; if (!(id in imports)) throw Error(id); return imports[id]; }, ...globals };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}
const location = { href: 'https://pawchive.pw/patreon/user/1', hostname: 'pawchive.pw' };
const rate = load('src/utils/pawchiveRateLimit.ts', {}, { URL, window: { location }, performance, DOMException, setTimeout, clearTimeout });
const requests = [];
const slots = [];
let saved = 0;
let statusFor = () => 200;
const http = load('src/utils/http.ts', {
  '../state/store': { state: { settings: { enableDownloadRetries: false } } },
  './saveFile': { saveBlobViaAnchor: () => { saved++; } },
  './helpers': { debugLog() {}, sanitizeFilename: name => name },
  './pawchiveRateLimit': {
    isPawchiveFile: rate.isPawchiveFile,
    withPawchiveFileLimit: async (url, signal, work) => { slots.push(url); return work(); },
  },
}, {
  window: { location }, URL, DOMException, ArrayBuffer, Blob, Uint8Array, AbortController,
  setTimeout, clearTimeout,
  GM_xmlhttpRequest: opts => {
    requests.push(opts);
    const status = statusFor(opts.url);
    Promise.resolve().then(() => opts.onload({ status, statusText: '', response: new Uint8Array([1, 2]).buffer }));
    return { abort() {} };
  },
});
const expectedUA = 'KemonoDownloadButton/1 (+https://github.com/bropines/kemono-download-button)';

(async () => {
  const details = { url: 'https://file.pawchive.pw/data/file.jpg', responseType: 'arraybuffer', headers: { Accept: 'image/*' } };
  await http.gmXmlhttpRequestWithRetries(details);
  assert.equal(requests.at(-1).headers['User-Agent'], expectedUA, 'file requests identify the downloader');
  assert.equal(requests.at(-1).headers.Accept, 'image/*');
  assert.equal(details.headers['User-Agent'], undefined, 'caller headers are not mutated');
  assert.equal(requests.at(-1).overrideMimeType, 'text/plain; charset=x-user-defined');

  await http.gmXmlhttpRequestWithRetries({ url: 'https://n1.pawchive.st/data/file.jpg', headers: { 'uSeR-aGeNt': 'Caller/2' } });
  assert.equal(requests.at(-1).headers['uSeR-aGeNt'], 'Caller/2');
  assert.equal(requests.at(-1).headers['User-Agent'], undefined, 'explicit header wins regardless of case');

  for (const url of ['https://pawchive.pw/api/v1/posts', 'https://kemono.su/data/file.jpg', 'https://evilpawchive.pw/data/file.jpg']) {
    await http.gmXmlhttpRequestWithRetries({ url });
    assert.equal(requests.at(-1).headers['User-Agent'], undefined, 'API and unrelated hosts remain unchanged');
  }

  statusFor = url => url.startsWith('https://pawchive.pw/data/') ? 404 : 200;
  await http.gmXmlhttpRequestWithRetries({ url: 'https://pawchive.pw/data/file.jpg' });
  assert.equal(requests.at(-2).headers['User-Agent'], expectedUA);
  assert.equal(requests.at(-1).url, 'https://file.pawchive.pw/data/file.jpg');
  assert.equal(requests.at(-1).headers['User-Agent'], expectedUA, '404 fallback preserves identity');
  assert.equal(slots.at(-1), requests.at(-1).url, 'fallback still goes through the limiter');

  statusFor = () => 403;
  const before = requests.length;
  await assert.rejects(http.gmXmlhttpRequestWithRetries({ url: 'https://file.pawchive.pw/data/file.jpg' }), error => error.status === 403);
  assert.equal(requests.length, before + 1, '403 is not retried');
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(http.gmXmlhttpRequestWithRetries({ url: 'https://file.pawchive.pw/data/file.jpg', signal: controller.signal }), { name: 'AbortError' });
  assert.equal(requests.length, before + 1, 'pre-aborted requests never reach the server');

  statusFor = () => 200;
  let cachedBytes;
  await http.downloadFileWithFallback('https://file.pawchive.pw/data/file.jpg', 'file.jpg', undefined, undefined,
    async data => { cachedBytes = [...new Uint8Array(data)]; });
  assert.deepEqual(cachedBytes, [1, 2], 'fallback passes the downloaded bytes to the cache');
  assert.equal(saved, 1);
  await http.downloadFileWithFallback('https://file.pawchive.pw/data/file.jpg', 'file.jpg', undefined, undefined,
    async () => { throw Error('storage unavailable'); });
  assert.equal(saved, 2, 'cache failure does not turn a browser download into an error');
  console.log('Pawchive downloader identification checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
