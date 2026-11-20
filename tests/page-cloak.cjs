const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// The page cloak (src/core/cloak.ts): hidden until reveal, holds delay the reveal up to a cap, a failsafe always shows.
const source = fs.readFileSync('src/core/cloak.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
// The real skeleton module (it has no imports)
const skeletonExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/skeleton.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: skeletonExports, encodeURIComponent });

function load({ failsafeMs, holdMs } = {}) {
  const attrs = new Set();
  const nodes = new Map();
  const html = {
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name) => attrs.add(name),
    removeAttribute: (name) => attrs.delete(name),
    appendChild: (node) => nodes.set(node.id, node),
  };
  const document = {
    documentElement: html,
    head: null,
    getElementById: (id) => nodes.get(id) || null,
    createElement: () => ({ id: '', textContent: '', setAttribute() {} }),
  };
  let text = compiled;
  if (failsafeMs) text = text.replace(/FAILSAFE_MS = \d+/, `FAILSAFE_MS = ${failsafeMs}`);
  if (holdMs) text = text.replace(/HOLD_MS = \d+/, `HOLD_MS = ${holdMs}`);
  const context = {
    exports: {},
    require: (id) => {
      if (id === './page') return { keepInHead: (node) => node };
      if (id === './skeleton') return skeletonExports;
      throw Error(id);
    },
    document,
    // Background tab: rAF never runs, the timer fallback must reveal
    requestAnimationFrame: () => 0,
    setTimeout,
    clearTimeout,
    Promise,
  };
  vm.runInNewContext(text, context);
  return { api: context.exports, cloaked: () => attrs.has('data-kdl-cloak'), style: () => nodes.get('kdl-cloak-style') };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  {
    const { api, cloaked, style } = load();
    api.reveal();
    assert.equal(cloaked(), false, 'reveal without a cloak does nothing');
    api.cloak();
    assert.equal(cloaked(), true);
    assert.match(style().textContent, /#main/, 'only the page content is hidden');
    assert.match(style().textContent, /#main::after[\s\S]*mask/, 'a skeleton stands in for it');
    api.reveal();
    assert.equal(cloaked(), true, 'the reveal waits for the next frame');
    await delay(150);
    assert.equal(cloaked(), false, 'revealed even when rAF never fires');
  }
  {
    const { api, cloaked } = load({ holdMs: 200 });
    api.cloak();
    let finish;
    api.holdCloak(new Promise((resolve) => { finish = resolve; }));
    api.reveal();
    await delay(130);
    assert.equal(cloaked(), true, 'a pending hold keeps the page hidden');
    finish();
    await delay(130);
    assert.equal(cloaked(), false, 'the page shows once the hold settled');
  }
  {
    const { api, cloaked } = load({ holdMs: 60 });
    api.cloak();
    api.holdCloak(new Promise(() => {}));
    api.holdCloak(Promise.reject(new Error('API down')));
    api.reveal();
    await delay(250);
    assert.equal(cloaked(), false, 'a slow or failed request only delays the reveal up to the cap');
  }
  {
    const { api, cloaked } = load({ failsafeMs: 50 });
    api.cloak();
    await delay(100);
    assert.equal(cloaked(), false, 'the failsafe reveals when nobody does');
  }
  {
    const { api, cloaked } = load({ holdMs: 300 });
    api.cloak();
    api.holdCloak(new Promise(() => {}));
    api.reveal();
    // A new page swap before the reveal: the old reveal must not show the new page early
    api.cloak();
    await delay(120);
    assert.equal(cloaked(), true, 'an older reveal does not uncover a newer cloak');
    api.reveal();
    await delay(150);
    assert.equal(cloaked(), false);
  }
  console.log('page cloak checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
