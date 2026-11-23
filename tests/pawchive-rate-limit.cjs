const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts): http.ts imports it
const pageBody = (() => { const js = require('typescript').transpileModule(require('node:fs').readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

function load(path, imports, globals) {
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: id => { if (id === './pageBody') return pageBody; if (!(id in imports)) throw Error(id); return imports[id]; }, ...globals };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}
const window = { location: { href: 'https://pawchive.pw/post', hostname: 'pawchive.pw' } };
const clock = { performance, setTimeout, clearTimeout, DOMException, URL, window };
const rate = load('src/utils/pawchiveRateLimit.ts', {}, clock);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const limiter = new rate.RequestStartLimiter(30, 2);
  const starts = [], releases = [];
  let active = 0, peak = 0;
  const jobs = Array.from({ length: 4 }, async () => {
    const release = await limiter.acquire();
    starts.push(performance.now());
    peak = Math.max(peak, ++active);
    releases.push(() => { active--; release(); });
  });
  await sleep(75);
  assert.equal(starts.length, 2, 'only two active slots can start');
  assert.equal(peak, 2);
  releases.shift()();
  await sleep(40);
  assert.equal(starts.length, 3, 'releasing a slot admits the next request');
  releases.shift()();
  await sleep(40);
  await Promise.all(jobs);
  releases.forEach(release => release());
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 27, 'starts are spaced');

  const blocked = new rate.RequestStartLimiter(10, 1);
  const release = await blocked.acquire();
  const controller = new AbortController();
  const cancelled = blocked.acquire(controller.signal);
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  release();
  const afterCancel = await blocked.acquire();
  afterCancel();
  afterCancel(); // idempotent release
  assert.equal(rate.isPawchiveFile('https://file.pawchive.pw/data/ab/cd/file'), true);
  assert.equal(rate.isPawchiveFile('https://pawchive.pw/data/file'), true);
  assert.equal(rate.isPawchiveFile('https://n1.pawchive.st/data/file'), true);
  assert.equal(rate.isPawchiveFile('https://pawchive.pw/api/v1/a'), false);
  assert.equal(rate.isPawchiveFile('https://evilpawchive.pw/data/file'), false);

  // A failed GM_download releases its slot before the GM request fallback acquires one.
  const requestStarts = [];
  let saved = 0;
  const gm = load('src/utils/http.ts', {
    '../state/store': { state: { settings: { enableDownloadRetries: false } } },
    './saveFile': { saveBlobViaAnchor: () => { saved++; } },
    './helpers': { debugLog() {}, sanitizeFilename: name => name },
    './pawchiveRateLimit': rate,
  }, { ...clock, ArrayBuffer, Blob, Uint8Array, AbortController,
    GM_download: opts => { requestStarts.push(performance.now()); setTimeout(() => opts.onerror('failed'), 0); },
    GM_xmlhttpRequest: opts => { requestStarts.push(performance.now()); setTimeout(() => opts.onload({ status: 200, response: new Uint8Array([1]).buffer }), 0); },
  });
  await gm.downloadFileWithFallback('https://file.pawchive.pw/data/file', 'x.jpg');
  assert.equal(saved, 1);
  assert.equal(requestStarts.length, 2);
  assert.ok(requestStarts[1] - requestStarts[0] >= 1000, 'fallback respects the server start interval');
  console.log('Pawchive request rate and cancellation checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
