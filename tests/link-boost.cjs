const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Links htmx did not boost go through a boosted one (src/core/boostLinks.ts)
function setup({ honoursPath = true } = {}) {
  const listeners = {};
  const on = (target) => (type, fn) => { listeners[`${target}:${type}`] = fn; };
  const assigned = [];
  const requests = [];
  const proxy = { closest: () => null, 'htmx-internal-data': { boosted: true } };
  const document = {
    body: { getAttribute: () => 'true' },
    querySelectorAll: () => [proxy],
    addEventListener: on('document'),
  };
  // htmx: a click on the boosted link asks for its config at once, then requests the (possibly changed) path
  proxy.click = () => {
    const detail = { elt: proxy, path: '/' };
    const shown = honoursPath ? detail : Object.defineProperty({ elt: proxy }, 'path', { get: () => detail.path, set: () => {} });
    let cancelled = false;
    listeners['document:htmx:configRequest']({ detail: shown, preventDefault: () => { cancelled = true; } });
    if (!cancelled) requests.push(detail.path);
  };
  const window = {
    location: { href: 'https://kemono.cr/fanbox/user/1', origin: 'https://kemono.cr', pathname: '/fanbox/user/1', search: '', assign: (url) => assigned.push(url) },
    addEventListener: on('window'),
  };
  const mod = {};
  const source = ts.transpileModule(fs.readFileSync('src/core/boostLinks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports: mod, window, document, URL, Date });
  mod.installLinkBoost();
  const click = (href, extra = {}) => {
    const link = { href: new URL(href, window.location.href).href, target: '', hasAttribute: () => false, closest: (sel) => (sel === 'a[href]' ? link : null) };
    let prevented = false;
    listeners['window:click']({ target: { closest: () => link }, button: 0, defaultPrevented: false, preventDefault: () => { prevented = true; }, ...extra });
    return prevented;
  };
  return { click, requests, assigned };
}

{
  const { click, requests, assigned } = setup();
  assert.equal(click('/patreon/user/9'), true, 'a plain click on one of our links is taken over');
  assert.deepEqual(requests, ['/patreon/user/9'], 'htmx loads our link, not the sidebar one');
  assert.deepEqual(assigned, []);
  assert.equal(click('/patreon/user/9', { ctrlKey: true }), false, 'a ctrl-click opens a tab as usual');
  assert.equal(click('https://example.com/x'), false, 'other sites are left alone');
  assert.equal(click('/data/ab/cd.png'), false, 'files are left alone');
  assert.equal(click('/patreon/user/9', { defaultPrevented: true }), false, 'a link htmx (or anyone) handled is left alone');
}
{
  const { click, requests, assigned } = setup({ honoursPath: false });
  click('/patreon/user/9');
  assert.deepEqual(requests, [], "when htmx does not see the new path, the sidebar link's page is not loaded");
  assert.deepEqual(assigned, ['/patreon/user/9'], 'and the browser follows the link instead');
}

console.log('link boost checks passed');
