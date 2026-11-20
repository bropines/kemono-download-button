const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/utils/http.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const settings = { enableDownloadRetries: true, downloadRetryCount: 1, downloadRetryDelay: 1, zipFileDownloadTimeout: 35 };
let xhrHandler;
let gmHandler;
let active = 0;
let maxActive = 0;
let saves = 0;
const imports = {
  '../state/store': { state: { settings } },
  './saveFile': { saveBlobViaAnchor: () => { saves++; } },
  './helpers': { debugLog() {}, sanitizeFilename: name => name },
  './pawchiveRateLimit': { isPawchiveFile: () => true, withPawchiveFileLimit: async (_url, signal, run) => {
    if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
    active++; maxActive = Math.max(maxActive, active);
    try { return await run(); } finally { active--; }
  } },
};
const sandbox = {
  exports: {}, require: id => { if (!(id in imports)) throw Error(id); return imports[id]; },
  window: { location: { hostname: 'pawchive.pw', href: 'https://pawchive.pw/' } },
  URL, Blob, ArrayBuffer, Uint8Array, DOMException, AbortController, setTimeout, clearTimeout, Date, performance,
  GM_xmlhttpRequest: options => xhrHandler(options),
  GM_download: options => gmHandler(options),
};
vm.runInNewContext(compiled, sandbox);
const { gmXmlhttpRequestWithRetries: request, downloadFileWithFallback: download } = sandbox.exports;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const bytes = () => new Uint8Array([1, 2, 3]).buffer;

(async () => {
  // A silent first request is aborted; a late success must not win over the retry.
  let calls = 0, aborts = 0, first;
  xhrHandler = opts => {
    calls++;
    if (calls === 1) first = opts;
    else setTimeout(() => opts.onload({ status: 200, response: bytes() }), 3);
    return { abort() { aborts++; opts.onabort(); } };
  };
  const result = await request({ url: 'https://file.pawchive.pw/data/a', responseType: 'arraybuffer', timeout: 25 });
  assert.equal(calls, 2, 'timeout triggers the configured retry');
  assert.equal(aborts, 1, 'the stalled request is aborted');
  assert.equal(result.response.byteLength, 3);
  first.onload({ status: 200, response: new Uint8Array([9]).buffer });
  assert.equal(active, 0, 'the old and successful retry slots are released');
  assert.equal(maxActive, 1, 'a retry never holds the timed-out slot');

  // Some managers return a Blob whose conversion never settles: keep the watchdog alive.
  calls = 0; aborts = 0;
  xhrHandler = opts => {
    calls++;
    const body = calls === 1 ? { arrayBuffer: () => new Promise(() => {}) } : bytes();
    setTimeout(() => opts.onload({ status: 200, response: body }), 1);
    return { abort() { aborts++; opts.onabort(); } };
  };
  await request({ url: 'https://file.pawchive.pw/data/normalize', responseType: 'arraybuffer', timeout: 25 });
  assert.equal(calls, 2, 'stuck response conversion is retried');
  assert.equal(aborts, 1);

  // Progress extends the inactivity limit; the host gets no absolute file timeout.
  calls = 0;
  xhrHandler = opts => {
    calls++;
    assert.equal(opts.timeout, 0, 'disable the host absolute deadline for file transfers');
    for (let n = 1; n <= 3; n++) setTimeout(() => opts.onprogress({ loaded: n, total: 3, lengthComputable: true }), n * 15);
    setTimeout(() => opts.onload({ status: 200, response: bytes() }), 58);
    return { abort() { throw Error('an active transfer must not be aborted'); } };
  };
  await request({ url: 'https://file.pawchive.pw/data/b', responseType: 'arraybuffer', timeout: 30 });
  assert.equal(calls, 1, 'progress prevents retry even beyond the original deadline');

  // Explicit cancellation is immediate and never schedules a retry.
  calls = 0; aborts = 0;
  xhrHandler = opts => { calls++; return { abort() { aborts++; opts.onabort(); } }; };
  const ctl = new AbortController();
  const cancelled = request({ url: 'https://file.pawchive.pw/data/c', responseType: 'arraybuffer', timeout: 100, signal: ctl.signal });
  setTimeout(() => ctl.abort(), 5);
  await assert.rejects(cancelled, { name: 'AbortError' });
  assert.equal(calls, 1);
  assert.equal(aborts, 1);
  assert.equal(active, 0);

  // GM_download has its own watchdog, retries stalled starts, and releases each slot.
  calls = 0; aborts = 0; maxActive = 0;
  gmHandler = opts => {
    calls++;
    if (calls === 2) setTimeout(() => opts.onload(), 3);
    return { abort() { aborts++; opts.onerror(); } };
  };
  await download('https://file.pawchive.pw/data/d', 'd.jpg');
  assert.equal(calls, 2, 'native manager timeout triggers a retry');
  assert.equal(aborts, 1);
  assert.equal(maxActive, 1);
  assert.equal(saves, 0, 'a successful native retry does not invoke a fallback');

  // Regular native progress keeps a long download alive past its original deadline.
  calls = 0;
  gmHandler = opts => {
    calls++;
    for (let n = 1; n <= 3; n++) setTimeout(() => opts.onprogress({ loaded: n, total: 3, lengthComputable: true }), n * 15);
    setTimeout(() => opts.onload(), 58);
    return { abort() { throw Error('an active native transfer must not be aborted'); } };
  };
  await download('https://file.pawchive.pw/data/progress', 'progress.jpg');
  assert.equal(calls, 1, 'native progress prevents retries');

  // Cancellation while the browser manager is stalled aborts it without starting fallback.
  calls = 0; aborts = 0;
  gmHandler = opts => { calls++; return { abort() { aborts++; opts.onerror(); } }; };
  const ctl2 = new AbortController();
  const nativeCancelled = download('https://file.pawchive.pw/data/e', 'e.jpg', undefined, ctl2.signal);
  setTimeout(() => ctl2.abort(), 5);
  await assert.rejects(nativeCancelled, { name: 'AbortError' });
  await delay(45);
  assert.equal(calls, 1);
  assert.equal(aborts, 1);
  assert.equal(active, 0);

  // Once native retries are exhausted the XHR fallback still has its own slot and watchdog.
  calls = 0; aborts = 0; maxActive = 0;
  let xhrCalls = 0, cached = false;
  gmHandler = opts => { calls++; return { abort() { aborts++; opts.onerror(); } }; };
  xhrHandler = opts => { xhrCalls++; setTimeout(() => opts.onload({ status: 200, response: bytes() }), 2); return { abort() {} }; };
  await download('https://file.pawchive.pw/data/fallback', 'fallback.jpg', undefined, undefined, async data => { cached = data.byteLength === 3; });
  assert.equal(calls, 2, 'native manager attempts are bounded by configured retries');
  assert.equal(aborts, 2);
  assert.equal(xhrCalls, 1, 'fallback begins once native retries finish');
  assert.equal(maxActive, 1, 'fallback acquires a slot after native timeout releases it');
  assert.equal(saves, 1);
  assert.equal(cached, true, 'fallback bytes can be cached by the caller');
  console.log('download inactivity timeout checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
