const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts): http.ts imports it
const pageBody = (() => { const js = require('typescript').transpileModule(require('node:fs').readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

// A host that does not follow redirects (AdGuard) answers a file request with nginx's "302 Found" page as if it
// were the file. The request must follow the Location itself, or fetch the file through the page, and never
// hand the page back as the file.
const source = fs.readFileSync('src/utils/http.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const settings = { enableDownloadRetries: true, downloadRetryCount: 0, downloadRetryDelay: 1, zipFileDownloadTimeout: 1000 };
let xhrHandler;
let fetchHandler;
const imports = {
  '../state/store': { state: { settings } },
  './saveFile': { saveBlobViaAnchor() {} },
  './helpers': { debugLog() {}, sanitizeFilename: (name) => name },
  './pawchiveRateLimit': { isPawchiveFile: () => true, withPawchiveFileLimit: async (_url, _signal, run) => run() },
};
const sandbox = {
  exports: {}, require: (id) => { if (id === './pageBody') return pageBody; if (!(id in imports)) throw Error(id); return imports[id]; },
  window: { location: { hostname: 'pawchive.pw', href: 'https://pawchive.pw/' } },
  URL, Blob, ArrayBuffer, Uint8Array, DOMException, AbortController, setTimeout, clearTimeout, Date, performance, String,
  GM_xmlhttpRequest: (options) => xhrHandler(options),
  fetch: (...args) => fetchHandler(...args),
};
vm.runInNewContext(compiled, sandbox);
const { gmXmlhttpRequestWithRetries: request } = sandbox.exports;

const page = '<html>\r\n<head><title>302 Found</title></head>\r\n<body>\r\n<center><h1>302 Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
const latin1 = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0)).buffer;
const image = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).buffer;

(async () => {
  // 1. The page comes back as a 200 with a Location header: followed, the image is returned
  const seen = [];
  xhrHandler = (opts) => {
    seen.push(opts.url);
    setTimeout(() => {
      if (opts.url.includes('n4.')) opts.onload({ status: 200, responseHeaders: 'content-type: text/html\r\nlocation: https://n9.pawchive.pw/data/a.jpeg\r\n', response: latin1(page) });
      else opts.onload({ status: 200, responseHeaders: 'content-type: image/jpeg\r\n', response: image() });
    }, 1);
    return { abort() {} };
  };
  const followed = await request({ url: 'https://n4.pawchive.pw/data/a.jpeg', responseType: 'arraybuffer', timeout: 500 });
  assert.equal(followed.response.byteLength, 7, 'the image behind the redirect is returned');
  assert.deepEqual(seen, ['https://n4.pawchive.pw/data/a.jpeg', 'https://n9.pawchive.pw/data/a.jpeg']);

  // 2. A real 302 status (AdGuard routes it through onerror) with a relative Location: followed
  seen.length = 0;
  xhrHandler = (opts) => {
    seen.push(opts.url);
    setTimeout(() => {
      if (seen.length === 1) opts.onerror({ status: 302, statusText: 'Found', responseHeaders: 'Location: /data/b.jpeg\r\n', response: latin1(page) });
      else opts.onload({ status: 200, responseHeaders: '', response: image() });
    }, 1);
    return { abort() {} };
  };
  const relative = await request({ url: 'https://n2.pawchive.pw/data/x.jpeg', responseType: 'arraybuffer', timeout: 500 });
  assert.equal(relative.response.byteLength, 7);
  assert.equal(seen[1], 'https://n2.pawchive.pw/data/b.jpeg', 'a relative Location resolves against the file URL');

  // 3. The page without any header (AdGuard drops them): the page's own fetch gets the file
  let fetched = 0;
  xhrHandler = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: '', response: latin1(page) }), 1); return { abort() {} }; };
  fetchHandler = async () => { fetched++; return { ok: true, status: 200, statusText: 'OK', url: 'https://n2.pawchive.pw/data/c.jpeg', headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => image() }; };
  const viaFetch = await request({ url: 'https://n2.pawchive.pw/data/c.jpeg', responseType: 'arraybuffer', timeout: 500 });
  assert.equal(fetched, 1, 'the page fetch is used once');
  assert.equal(viaFetch.response.byteLength, 7);

  // 4. Nothing gets the file: the request fails instead of returning the page as the file
  fetchHandler = async () => ({ ok: true, status: 200, headers: { get: () => 'text/html' }, arrayBuffer: async () => latin1(page) });
  await assert.rejects(request({ url: 'https://n2.pawchive.pw/data/d.jpeg', responseType: 'arraybuffer', timeout: 500 }), /page instead of the file/);

  // 5. A real image is untouched, and an HTML file the user asked for is not mistaken for an error page
  xhrHandler = (opts) => { setTimeout(() => opts.onload({ status: 200, responseHeaders: 'content-type: text/html\r\n', response: latin1(page) }), 1); return { abort() {} }; };
  const html = await request({ url: 'https://n2.pawchive.pw/data/e.html?f=page.html', responseType: 'arraybuffer', timeout: 500 });
  assert.equal(html.response.byteLength, page.length, 'an .html file is returned as is');

  console.log('download-redirect-page: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
