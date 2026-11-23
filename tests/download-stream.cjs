const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts): http.ts imports it
const pageBody = (() => { const js = require('typescript').transpileModule(require('node:fs').readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

// A userscript host that reports no progress (AdGuard): archive files are read by the page's own fetch as a stream.
// A slow transfer that keeps sending bytes is never cut off, a stalled one is retried, and nothing but the whole
// file is handed back: no page, no empty body, no body shorter than announced.
const compiled = ts.transpileModule(fs.readFileSync('src/utils/http.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

/** A fresh copy of http.ts (what it learned about the host lives in the module) */
function host({ scriptHandler, hostname = 'pawchive.pw' } = {}) {
  const env = {
    settings: { enableDownloadRetries: true, downloadRetryCount: 0, downloadRetryDelay: 1 },
    xhr: () => { throw Error('unexpected GM request'); },
    fetch: () => { throw Error('unexpected page fetch'); },
    xhrCalls: 0, fetchCalls: 0, slots: 0,
  };
  const imports = {
    '../state/store': { state: { settings: env.settings } },
    './saveFile': { saveBlobViaAnchor() {} },
    './helpers': { debugLog() {}, sanitizeFilename: (name) => name },
    './pawchiveRateLimit': {
      isPawchiveFile: (url) => /pawchive/.test(url) && url.includes('/data/'),
      withPawchiveFileLimit: async (_url, _signal, run) => { env.slots++; return run(); },
    },
  };
  const sandbox = {
    exports: {}, require: (id) => { if (id === './pageBody') return pageBody; if (!(id in imports)) throw Error(id); return imports[id]; },
    window: { location: { hostname, href: `https://${hostname}/` } },
    URL, Blob, ArrayBuffer, Uint8Array, DOMException, AbortController, setTimeout, clearTimeout, Date, performance,
    GM_xmlhttpRequest: (options) => { env.xhrCalls++; return env.xhr(options) || { abort() {} }; },
    fetch: (url, init) => { env.fetchCalls++; return env.fetch(url, init); },
  };
  if (scriptHandler) sandbox.GM_info = { scriptHandler };
  vm.runInNewContext(compiled, sandbox);
  env.request = sandbox.exports.gmXmlhttpRequestWithRetries;
  return env;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jpeg = (size) => { const data = new Uint8Array(size).fill(7); data.set([0xff, 0xd8, 0xff, 0xe0]); return data; };
const page = Uint8Array.from('<html>\r\n<head><title>302 Found</title></head>\r\n<body></body></html>', (c) => c.charCodeAt(0));

/** A fetch Response whose body arrives in `chunks`, `gap` ms apart; a null chunk never arrives */
function streamed(init, { chunks, gap = 0, type = 'image/jpeg', length, status = 200, encoding = '' }) {
  const state = { cancelled: false, reads: 0 };
  let index = 0;
  const headers = { 'content-type': type, 'content-length': length === undefined ? '' : String(length), 'content-encoding': encoding };
  const response = {
    ok: status >= 200 && status < 300, status, statusText: '', url: 'https://n2.pawchive.pw/final',
    headers: { get: (name) => headers[name.toLowerCase()] || null },
    body: { getReader: () => ({ read: () => new Promise((resolve, reject) => {
      state.reads++;
      const onAbort = () => { state.cancelled = true; reject(new DOMException('aborted', 'AbortError')); };
      if (init.signal.aborted) return onAbort();
      init.signal.addEventListener('abort', onAbort, { once: true });
      const chunk = chunks[index++];
      if (chunk === null) return;
      setTimeout(() => resolve(chunk === undefined ? { done: true } : { done: false, value: chunk }), gap);
    }) }) },
  };
  init.signal.addEventListener('abort', () => { state.cancelled = true; }, { once: true });
  return { response, state };
}
const file = (url, extra = {}) => ({ url, responseType: 'arraybuffer', timeout: 30, ...extra });

(async () => {
  // --- AdGuard: known to report no progress from the start ---
  {
    const env = host({ scriptHandler: 'AdGuard' });

    // 1. Slow but progressing: 5 chunks 15 ms apart outlive the 30 ms deadline; progress is reported per chunk
    const whole = jpeg(50);
    const progress = [];
    env.fetch = async (_url, init) => {
      assert.equal(init.credentials, 'omit');
      return streamed(init, { chunks: [0, 10, 20, 30, 40].map((at) => whole.slice(at, at + 10)), gap: 15, length: 50 }).response;
    };
    const slow = await env.request(file('https://n2.pawchive.pw/data/slow.jpeg', { onprogress: (e) => progress.push([e.loaded, e.total, e.lengthComputable]) }));
    assert.deepEqual(new Uint8Array(slow.response), whole, 'the whole file, in order');
    assert.deepEqual(progress, [[10, 50, true], [20, 50, true], [30, 50, true], [40, 50, true], [50, 50, true]]);
    assert.equal(env.xhrCalls, 0, 'the GM request is not used');
    assert.equal(env.slots, 1, 'the stream holds a rate-limiter slot');

    // 2. Stalled after the first chunk: cut off at the deadline, the transfer is stopped, and the retry gets the file
    env.settings.downloadRetryCount = 1;
    const attempts = [];
    env.fetch = async (_url, init) => {
      const attempt = streamed(init, attempts.length === 0 ? { chunks: [whole.slice(0, 10), null], length: 50 } : { chunks: [whole], length: 50 });
      attempts.push(attempt.state);
      return attempt.response;
    };
    const retried = await env.request(file('https://n2.pawchive.pw/data/stalled.jpeg'));
    assert.equal(retried.response.byteLength, 50);
    assert.equal(attempts.length, 2, 'a stalled stream is retried');
    assert.equal(attempts[0].cancelled, true, 'the stalled transfer is aborted');
    assert.equal(attempts[1].cancelled, false, 'a finished transfer is not aborted');
    env.settings.downloadRetryCount = 0;

    // 3. No announced length, or a compressed body longer than announced: still the whole file
    env.fetch = async (_url, init) => streamed(init, { chunks: [whole.slice(0, 20), whole.slice(20)] }).response;
    assert.deepEqual(new Uint8Array((await env.request(file('https://n2.pawchive.pw/data/chunked.jpeg'))).response), whole);
    env.fetch = async (_url, init) => streamed(init, { chunks: [whole.slice(0, 20), whole.slice(20)], length: 30 }).response;
    const longer = [];
    assert.deepEqual(new Uint8Array((await env.request(file('https://n2.pawchive.pw/data/longer.jpeg', { onprogress: (e) => longer.push(e.lengthComputable) }))).response), whole);
    assert.deepEqual(longer, [true, false], 'a length that proved wrong is no longer reported as the total');

    // 4. Cut off before the announced length: not the file. The GM request takes over, and is checked the same way
    env.fetch = async (_url, init) => streamed(init, { chunks: [whole.slice(0, 20)], length: 50 }).response;
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'Content-Length: 50\r\n', response: whole.buffer.slice(0) }), 1); };
    env.xhrCalls = 0;
    assert.equal((await env.request(file('https://n2.pawchive.pw/data/short.jpeg'))).response.byteLength, 50, 'the GM request delivers the file');
    assert.equal(env.xhrCalls, 1);
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'Content-Length: 50\r\n', response: whole.buffer.slice(0, 20) }), 1); };
    await assert.rejects(env.request(file('https://n2.pawchive.pw/data/short2.jpeg')), /incomplete \(20 of 50 bytes\)/);

    // 5. An empty body is not a file
    env.fetch = async (_url, init) => streamed(init, { chunks: [] }).response;
    await assert.rejects(env.request(file('https://n2.pawchive.pw/data/empty.jpeg')), /empty/);

    // 6. A page: by its type the body is not even read and the transfer is stopped; the GM request is tried, and
    // when it gets the page too the request fails without fetching the same address a second time
    let pageState;
    env.fetch = async (_url, init) => { const made = streamed(init, { chunks: [page], type: 'text/html; charset=utf-8' }); pageState = made.state; return made.response; };
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: page.buffer.slice(0) }), 1); };
    env.fetchCalls = 0; env.xhrCalls = 0;
    await assert.rejects(env.request(file('https://n2.pawchive.pw/data/page.jpeg')), /page instead of the file/);
    assert.equal(pageState.reads, 0, 'a text/html body is not downloaded');
    assert.equal(pageState.cancelled, true, 'and its transfer is aborted');
    assert.deepEqual([env.fetchCalls, env.xhrCalls], [1, 1], 'one page fetch, one GM request');
    // ...and a page sent with a file's type is caught by its bytes
    env.fetch = async (_url, init) => streamed(init, { chunks: [page] }).response;
    await assert.rejects(env.request(file('https://n2.pawchive.pw/data/page2.jpeg')), /page instead of the file/);

    // 7. An .html attachment is a file
    env.fetch = async (_url, init) => streamed(init, { chunks: [page], type: 'text/html' }).response;
    assert.equal((await env.request(file('https://n2.pawchive.pw/data/notes.html?f=notes.html'))).response.byteLength, page.length);

    // 8. Cancelling stops the stream at once and nothing is retried
    env.settings.downloadRetryCount = 3;
    let cancelState;
    env.fetch = async (_url, init) => { const made = streamed(init, { chunks: [whole.slice(0, 10), null], length: 50 }); cancelState = made.state; return made.response; };
    env.fetchCalls = 0;
    const ctl = new AbortController();
    const cancelled = env.request(file('https://n2.pawchive.pw/data/cancel.jpeg', { signal: ctl.signal, timeout: 500 }));
    setTimeout(() => ctl.abort(), 5);
    await assert.rejects(cancelled, { name: 'AbortError' });
    assert.equal(cancelState.cancelled, true);
    assert.equal(env.fetchCalls, 1);
    await assert.rejects(env.request(file('https://n2.pawchive.pw/data/cancelled-before.jpeg', { signal: ctl.signal })), { name: 'AbortError' });
    assert.equal(env.fetchCalls, 1, 'an already cancelled request starts nothing');
    env.settings.downloadRetryCount = 0;

    // 9. A refusal the GM request's own headers may avoid (403) goes to the GM request
    env.fetch = async (_url, init) => streamed(init, { chunks: [], status: 403 }).response;
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: whole.buffer.slice(0) }), 1); };
    assert.equal((await env.request(file('https://n2.pawchive.pw/data/forbidden.jpeg'))).response.byteLength, 50);

    // 10. Only the archive's own files are page-fetched first; other requests stay with the GM request
    env.fetch = () => { throw Error('must not be page-fetched'); };
    await env.request(file('https://cdn.example.com/data/file.jpeg'));
    await env.request({ url: 'https://pawchive.pw/api/v1/posts', timeout: 30 });
  }

  // --- AdGuard on a site whose file host does not let the page read it (no CORS) ---
  {
    const env = host({ scriptHandler: 'AdGuard for Android', hostname: 'kemono.cr' });
    const whole = jpeg(50);
    env.fetch = async () => { throw new TypeError('Failed to fetch'); };
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: whole.buffer.slice(0) }), 1); };
    for (const name of ['a', 'b', 'c', 'd']) {
      assert.equal((await env.request(file(`https://kemono.cr/data/${name}.jpeg`))).response.byteLength, 50, 'the GM request still delivers the file');
    }
    assert.equal(env.fetchCalls, 2, 'after two refusals that host is left to the GM request for the session');
    assert.equal(env.xhrCalls, 4);

    // With no progress to hear, silence says nothing there: the file gets a longer deadline (4x) before it is given up
    let aborted = 0;
    env.xhr = (opts) => { assert.equal(opts.timeout, 0); setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: whole.buffer.slice(0) }), 75); return { abort() { aborted++; } }; };
    assert.equal((await env.request(file('https://kemono.cr/data/slow.jpeg'))).response.byteLength, 50, 'a slow file outlives the plain deadline');
    assert.equal(aborted, 0);
    env.xhr = (opts) => ({ abort() { aborted++; opts.onabort(); } });
    const started = Date.now();
    await assert.rejects(env.request(file('https://kemono.cr/data/dead.jpeg')), /Request Timeout/);
    assert.equal(aborted, 1, 'a request that never answers is still given up');
    assert.ok(Date.now() - started >= 110, 'only after the longer deadline');
  }

  // --- An unknown host: what it does about progress is learned while it works ---
  {
    // A file request that times out without one progress event: the retry reads the file through the page
    const env = host();
    const whole = jpeg(50);
    env.settings.downloadRetryCount = 1;
    let aborted = 0;
    env.xhr = (opts) => ({ abort() { aborted++; opts.onabort(); } });
    env.fetch = async (_url, init) => streamed(init, { chunks: [whole.slice(0, 25), whole.slice(25)], gap: 20, length: 50 }).response;
    const learned = await env.request(file('https://n2.pawchive.pw/data/first.jpeg'));
    assert.equal(learned.response.byteLength, 50);
    assert.deepEqual([env.xhrCalls, aborted, env.fetchCalls], [1, 1, 1], 'GM request timed out, then the page stream delivered');
    await env.request(file('https://n2.pawchive.pw/data/second.jpeg'));
    assert.deepEqual([env.xhrCalls, env.fetchCalls], [1, 2], 'later files go straight to the page stream');
  }
  {
    // A large file that finished without one progress event proves the same
    const env = host();
    const big = jpeg(1024 * 1024);
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: big.buffer }), 1); };
    await env.request(file('https://n2.pawchive.pw/data/big.jpeg'));
    env.fetch = async (_url, init) => streamed(init, { chunks: [jpeg(8)], length: 8 }).response;
    await env.request(file('https://n2.pawchive.pw/data/next.jpeg'));
    assert.deepEqual([env.xhrCalls, env.fetchCalls], [1, 1]);
  }
  {
    // A host that reports progress keeps the GM request, whatever happens later
    const env = host();
    const whole = jpeg(50);
    env.settings.downloadRetryCount = 1;
    let aborted = 0;
    env.xhr = (opts) => {
      setTimeout(() => opts.onprogress({ loaded: 25, total: 50, lengthComputable: true }), 1);
      setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: whole.buffer.slice(0) }), 2);
    };
    await env.request(file('https://n2.pawchive.pw/data/reported.jpeg'));
    env.xhr = (opts) => {
      if (env.xhrCalls === 2) return { abort() { aborted++; opts.onabort(); } };
      setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: whole.buffer.slice(0) }), 1);
    };
    await env.request(file('https://n2.pawchive.pw/data/stalled.jpeg'));
    assert.deepEqual([env.xhrCalls, aborted, env.fetchCalls], [3, 1, 0], 'a stall is retried by the GM request, at the plain deadline');
  }

  // --- The GM request's own answers (every host) ---
  {
    const env = host();
    const whole = jpeg(50);
    // An empty 2xx body is retried, then fails; it is never handed back as a file
    env.settings.downloadRetryCount = 1;
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: new ArrayBuffer(0) }), 1); };
    await assert.rejects(env.request(file('https://kemono.example/data/empty.jpeg')), /empty/);
    assert.equal(env.xhrCalls, 2, 'retried once');
    // Fewer bytes than Content-Length: retried, and the retry's full body is returned
    env.xhrCalls = 0;
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'content-type: image/jpeg\r\ncontent-length: 50\r\n', response: whole.buffer.slice(0, env.xhrCalls === 1 ? 20 : 50) }), 1); };
    assert.equal((await env.request(file('https://kemono.example/data/cut.jpeg'))).response.byteLength, 50);
    assert.equal(env.xhrCalls, 2);
    // A compressed body's length is not comparable; a text answer (a host ignoring responseType) is counted in bytes
    env.settings.downloadRetryCount = 0;
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'Content-Encoding: gzip\r\nContent-Length: 500\r\n', response: whole.buffer.slice(0) }), 1); };
    assert.equal((await env.request(file('https://kemono.example/data/gzip.txt'))).response.byteLength, 50);
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'Content-Length: 4\r\n', response: '' }), 1); };
    assert.equal((await env.request(file('https://kemono.example/data/text.jpeg'))).response.byteLength, 4);
    // Requests that are not for bytes are not judged by their body
    env.xhr = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: '', responseText: '' }), 1); };
    assert.equal((await env.request({ url: 'https://kemono.example/api/v1/empty' })).status, 200);
  }

  // --- Redirects the host hands back unfollowed ---
  {
    const env = host();
    const redirectTo = (location) => (opts) => { setTimeout(() => opts.onerror({ status: 302, statusText: 'Found', responseHeaders: `Location: ${location(opts.url)}\r\n`, response: page.buffer.slice(0) }), 1); };
    // A loop (a -> b -> a) is left after one round, and the page fetch is given one try
    const seen = [];
    env.fetch = async () => { throw new TypeError('Failed to fetch'); };
    const loop = redirectTo((url) => (url.includes('/a.jpeg') ? 'https://n2.pawchive.pw/data/b.jpeg' : 'https://n1.pawchive.pw/data/a.jpeg'));
    env.xhr = (opts) => { seen.push(opts.url); return loop(opts); };
    await assert.rejects(env.request(file('https://n1.pawchive.pw/data/a.jpeg')), /HTTP Status 302/);
    assert.deepEqual(seen, ['https://n1.pawchive.pw/data/a.jpeg', 'https://n2.pawchive.pw/data/b.jpeg']);
    assert.equal(env.fetchCalls, 1);
    // A Location that is not http(s) is not followed
    seen.length = 0; env.fetchCalls = 0;
    const script = redirectTo(() => 'javascript:alert(1)');
    env.xhr = (opts) => { seen.push(opts.url); return script(opts); };
    await assert.rejects(env.request(file('https://n1.pawchive.pw/data/c.jpeg')), /HTTP Status 302/);
    assert.deepEqual(seen, ['https://n1.pawchive.pw/data/c.jpeg']);
    // The page fetch that takes over for an unfollowed redirect is rate-limited like any other file request
    env.slots = 0;
    env.fetch = async (_url, init) => streamed(init, { chunks: [jpeg(8)], length: 8 }).response;
    assert.equal((await env.request(file('https://n1.pawchive.pw/data/d.jpeg'))).response.byteLength, 8);
    assert.equal(env.slots, 2, 'one slot for the GM request, one for the page fetch');
  }

  await delay(5);
  console.log('download-stream: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
