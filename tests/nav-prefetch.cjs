const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Faster navigation (src/modules/navPrefetch): a pressed link is fetched with htmx's headers, and htmx's own
// request for that address gets the fetched page instead of going to the server; any doubt, the real request goes.
const source = fs.readFileSync('src/modules/navPrefetch/index.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

const ORIGIN = 'https://pawchive.test';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function load({ respond, hxBoost = 'true' } = {}) {
  const listeners = new Map();
  const fetched = [];
  const body = {
    'htmx-internal-data': {},
    getAttribute: (name) => (name === 'hx-boost' ? hxBoost : null),
  };
  const document = {
    body,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
  };
  const context = {
    exports: {},
    require: () => ({}),
    document,
    window: { location: { href: `${ORIGIN}/posts`, origin: ORIGIN, pathname: '/posts', search: '' } },
    navigator: {},
    console,
    URL,
    Headers,
    AbortController,
    Promise,
    Date,
    setTimeout,
    clearTimeout,
    ProgressEvent: class { constructor(type) { this.type = type; } },
    fetch: (url, init) => {
      fetched.push({ url, headers: init.headers });
      return respond(url);
    },
  };
  vm.runInNewContext(compiled, context);
  const cleanups = [];
  const settings = { hover: false };
  context.exports.navPrefetchModule.mount({ settings: { get: (key) => settings[key] }, onCleanup: (fn) => cleanups.push(fn) });
  return { listeners, fetched, settings, unmount: () => cleanups.forEach((fn) => fn()) };
}

function link(href, attrs = {}) {
  const node = {
    href: ORIGIN + href,
    target: '',
    classList: { contains: (name) => (attrs.class || '') === name },
    hasAttribute: (name) => name === 'href' || name in attrs,
    getAttribute: (name) => attrs[name] ?? null,
    // The <body hx-boost hx-target="#main"> around every link
    closest: (selector) => (selector === 'a[href]' ? node : selector === '[hx-target]' ? { getAttribute: () => '#main' } : null),
  };
  return node;
}

const press = (env, node, extra = {}) => env.listeners.get('pointerdown')({ button: 0, target: node, ...extra });

// What htmx hands out in htmx:beforeSend: an opened request it is about to send()
function request(path, { boosted = true, verb = 'get' } = {}) {
  const calls = { sent: 0, aborted: 0, events: [] };
  const xhr = {
    status: 0,
    response: '',
    send: () => { calls.sent++; },
    abort: () => { calls.aborted++; },
    dispatchEvent: (event) => { calls.events.push(event.type); xhr[`on${event.type}`]?.(event); return true; },
  };
  return { xhr, calls, event: { detail: { xhr, boosted, requestConfig: { verb }, pathInfo: { finalRequestPath: path, requestPath: path } } } };
}

const page = (text, { status = 200, url = null, type = 'text/html; charset=utf-8', extra = {} } = {}) => (asked) =>
  Promise.resolve({ status, url: url || ORIGIN + asked, headers: new Headers({ 'content-type': type, ...extra }), text: async () => text });

(async () => {
  {
    const env = load({ respond: page('<main id="main">tags</main>', { extra: { 'HX-Push-Url': '/posts/tags' } }) });
    press(env, link('/posts/tags'));
    assert.equal(env.fetched.length, 1, 'a pressed link is fetched');
    assert.equal(env.fetched[0].url, '/posts/tags');
    assert.deepEqual({ ...env.fetched[0].headers }, { 'HX-Request': 'true', 'HX-Boosted': 'true', 'HX-Current-URL': `${ORIGIN}/posts`, 'HX-Target': 'main' }, 'with the headers htmx sends for a boosted link');
    press(env, link('/posts/tags'));
    assert.equal(env.fetched.length, 1, 'once per address');

    const { xhr, calls, event } = request('/posts/tags');
    let loaded = null;
    xhr.onload = () => { loaded = { status: xhr.status, body: xhr.response, url: xhr.responseURL, push: xhr.getResponseHeader('HX-Push-Url'), all: xhr.getAllResponseHeaders() }; };
    env.listeners.get('htmx:beforeSend')(event);
    xhr.send(null);
    await delay(10);
    assert.equal(calls.sent, 0, 'htmx\'s request does not go to the server');
    assert.deepEqual(calls.events, ['loadstart', 'load', 'loadend'], 'and reports the fetched page the way a real one does');
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body, '<main id="main">tags</main>');
    assert.equal(loaded.url, `${ORIGIN}/posts/tags`);
    assert.equal(loaded.push, '/posts/tags', 'response headers reach htmx');
    assert.match(loaded.all, /hx-push-url: \/posts\/tags/i);

    // The page was used: the next request for the address is an ordinary one
    const again = request('/posts/tags');
    env.listeners.get('htmx:beforeSend')(again.event);
    again.xhr.send(null);
    assert.equal(again.calls.sent, 1, 'a fetched page is used once');
  }
  {
    // Anything but a plain page: the server answers htmx itself
    for (const respond of [page('nope', { status: 404 }), page('{}', { type: 'application/json' }), page('x', { url: 'https://elsewhere.test/login' }), () => Promise.reject(new Error('offline'))]) {
      const env = load({ respond });
      press(env, link('/artists'));
      const { xhr, calls, event } = request('/artists');
      env.listeners.get('htmx:beforeSend')(event);
      xhr.send('body');
      await delay(10);
      assert.equal(calls.sent, 1, 'the real request is sent when the fetch did not bring a page');
      assert.ok(!calls.events.includes('load'));
    }
  }
  {
    const env = load({ respond: page('<main></main>') });
    const skipped = [
      [link('/account/logout'), 'a link that does something'],
      [link('/posts', {}), 'the page that is open'],
      [link('/data/aa/bb/file.png'), 'a file'],
      [link('/artists', { download: '' }), 'a download'],
      [link('/artists', { 'hx-get': '/x' }), 'a link with its own htmx request'],
    ];
    for (const [node, what] of skipped) {
      press(env, node);
      assert.equal(env.fetched.length, 0, `not fetched: ${what}`);
    }
    press(env, link('/artists'), { ctrlKey: true });
    press(env, link('/artists'), { button: 1 });
    assert.equal(env.fetched.length, 0, 'not fetched: a click that opens a new tab');

    press(env, link('/artists'));
    assert.equal(env.fetched.length, 1);
    // Requests that are not a followed link are left alone
    for (const options of [{ boosted: false }, { verb: 'post' }]) {
      const { xhr, calls, event } = request('/artists', options);
      env.listeners.get('htmx:beforeSend')(event);
      xhr.send(null);
      assert.equal(calls.sent, 1, 'another kind of request for the address is not answered');
    }
  }
  {
    // htmx aborts the request (another link was followed): nothing is delivered afterwards
    let release;
    const env = load({ respond: (asked) => new Promise((resolve) => { release = () => resolve(page('<main>late</main>')(asked)); }) });
    press(env, link('/dms'));
    const { xhr, calls, event } = request('/dms');
    env.listeners.get('htmx:beforeSend')(event);
    xhr.send(null);
    xhr.abort();
    release();
    await delay(10);
    assert.deepEqual(calls.events, ['loadstart', 'abort', 'loadend'], 'an aborted request says so and stays quiet');
    assert.equal(calls.sent, 0);
  }
  {
    // A site without htmx navigation: the module does nothing
    const env = load({ respond: page('x'), hxBoost: null });
    assert.equal(env.listeners.size, 0);
  }
  {
    const env = load({ respond: page('x') });
    assert.ok(env.listeners.has('pointerdown') && env.listeners.has('htmx:beforeSend'));
    env.unmount();
    assert.equal(env.listeners.size, 0, 'unmount removes every listener');
  }
  console.log('nav prefetch checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
