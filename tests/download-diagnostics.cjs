const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// The real page-body detector (src/utils/pageBody.ts): http.ts imports it
const pageBody = (() => { const js = require('typescript').transpileModule(require('node:fs').readFileSync('src/utils/pageBody.ts', 'utf8'), { compilerOptions: { module: 1 } }).outputText; const m = { exports: {} }; new Function('exports', 'module', js)(m.exports, m); return m.exports; })();

function load(path, imports, globals) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {}, require: id => { if (id === './pageBody') return pageBody; if (!(id in imports)) throw Error(id); return imports[id]; }, ...globals };
  vm.runInNewContext(js, sandbox);
  return sandbox.exports;
}

const secret = 'PRIVATE-SECRET';
const logs = [];
const state = { settings: { enableDebugLogging: false, enableDownloadRetries: false, sessionCookie: secret } };
const debugLog = (...args) => { if (state.settings.enableDebugLogging) logs.push(args); };
const window = { location: { href: 'https://pawchive.pw/post', hostname: 'pawchive.pw' } };
let mode = 'success';
const imports = {
  '../state/store': { state },
  './helpers': { debugLog, sanitizeFilename: name => name },
  './saveFile': { saveBlobViaAnchor() { debugLog('[download]', 'browser-save-triggered', { transport: 'anchor', bytes: 2 }); } },
  './pawchiveRateLimit': {
    isPawchiveFile: url => new URL(url).pathname.startsWith('/data/'),
    withPawchiveFileLimit: (_url, _signal, work) => work(),
  },
};
const globals = { window, URL, DOMException, ArrayBuffer, Blob, Uint8Array, setTimeout, clearTimeout,
  GM_xmlhttpRequest(options) {
    queueMicrotask(() => {
      if (mode === 'success') options.onload({ status: 200, response: '\uf780\uf781', responseText: secret });
      else options.onerror({ status: 403, statusText: secret, responseText: secret, finalUrl: `https://file.pawchive.pw/${secret}` });
    });
    return { abort() {} };
  },
};
const http = load('src/utils/http.ts', imports, globals);
const url = `https://file.pawchive.pw/data/${secret}.jpg?token=${secret}`;
(async () => {
  await http.gmXmlhttpRequestWithRetries({ url, responseType: 'arraybuffer', headers: { Authorization: secret } });
  assert.equal(logs.length, 0, 'diagnostics are silent when debug is disabled');
  state.settings.enableDebugLogging = true;
  const response = await http.gmXmlhttpRequestWithRetries({ url, responseType: 'arraybuffer', headers: { Authorization: secret } });
  assert.equal(response.response.byteLength, 2);
  assert(logs.some(line => line.includes('request-start') && line[2].host === 'file.pawchive.pw' && line[2].userAgentRequested === true));
  assert(logs.some(line => line.includes('response') && line[2].status === 200 && line[2].kind === 'text' && line[2].textUnits === 2));
  assert(logs.some(line => line.includes('normalized') && line[2].kind === 'arraybuffer' && line[2].bytes === 2));
  mode = 'failure';
  await assert.rejects(http.gmXmlhttpRequestWithRetries({ url, responseType: 'arraybuffer' }));
  assert(logs.some(line => line.includes('response') && line[2].status === 403));
  assert(logs.some(line => line.includes('request-failed') && line[2].status === 403));
  assert(!JSON.stringify(logs).includes(secret), 'logs omit URL paths, filenames, tokens, response bodies and errors');

  const warnings = [];
  const anchor = { style: {}, click() {}, remove() {} };
  const saves = load('src/utils/saveFile.ts', { './helpers': { debugLog } }, {
    Blob, URL: { createObjectURL: () => `blob:${secret}`, revokeObjectURL() {} },
    document: { createElement: () => anchor, body: { appendChild() {} } },
    setTimeout() {}, console: { warn: (...args) => warnings.push(args) },
    GM_download: options => options.onerror({ message: secret }),
  });
  saves.saveBlob(new Blob(['hi']), `${secret}.zip`);
  assert(logs.some(line => line.includes('save-fallback') && line[2].reason === 'error'));
  assert(logs.some(line => line.includes('browser-save-triggered') && line[2].bytes === 2));
  assert(!JSON.stringify([logs, warnings]).includes(secret), 'save diagnostics and warnings omit names, blob URLs and errors');
  console.log('download diagnostics privacy checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
