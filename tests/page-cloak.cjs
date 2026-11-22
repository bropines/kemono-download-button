const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// The page cloak (src/core/cloak.ts): hidden until reveal, holds delay the reveal up to a cap, a failsafe always shows.
const source = fs.readFileSync('src/core/cloak.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
// The real skeleton renderer (it imports types only)
const skeletonExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/skeleton.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: skeletonExports, require: () => ({}) });
const SNAP = { v: 1, pad: [24, 32, 32], h: 400, shapes: [{ k: 's', x: [0.5, -480], w: [0, 960], y: 0, h: 270, r: 12, f: 'rgb(17, 17, 17)', s: 'rgb(38, 38, 38)' }, { k: 't', x: [0, 0], w: [1, -40], y: 300, h: 10, r: 4 }],
  grid: { x: [0, 0], w: [1, 0], y: 320, tw: 209, th: 306, gap: 16, shapes: [{ k: 'i', x: [0, 0], w: [0, 193], y: 0, h: 193, r: 12 }] } };

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
    // A background tab: no animation frames, the reveal goes by timer
    hidden: true,
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
      if (id === './skeletonStore') return { snapshotFor: (path) => (path === '/none' ? null : SNAP) };
      throw Error(id);
    },
    document,
    window: { location: { pathname: '/fanbox/user/1' } },
    // Background tab: rAF never runs, the timer fallback must reveal
    requestAnimationFrame: () => 0,
    setTimeout,
    clearTimeout,
    Promise,
  };
  vm.runInNewContext(text, context);
  return { api: context.exports, cloaked: () => attrs.has('data-kdl-cloak'), skeleton: () => attrs.has('data-kdl-skeleton'), style: () => nodes.get('kdl-cloak-style') };
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
    const css = style().textContent;
    assert.match(css, /#main > \*[^{]*\{ opacity: 0 !important/, 'the content is hidden, not #main itself');
    assert.match(css, /#main::before \{[\s\S]*?data:image\/svg\+xml/, 'the snapshot is drawn on #main::before');
    assert.match(css, /calc\(50%25 - 479\.5px\)/, 'a centred box keeps to the centre at any width (its stroke inside the box)');
    assert.match(css, /#main::after \{ display: block[\s\S]*?space repeat/, 'the card grid repeats one tile');
    assert.match(css, /html\[data-kdl-skeleton\]\[data-kdl-enter\]:not\(\[data-kdl-cloak\]\) #main::before, [^{]*::after \{ opacity: 0; \}/, 'a shown page never has the skeleton over it, transitions or not');
    assert.doesNotMatch(css.replace(/html\[data-kdl-skeleton\][^{]*\{/g, ''), /::before|::after/, 'the skeleton is only ever drawn under <html data-kdl-skeleton>');
    assert.match(css, /html\[data-kdl-cloak\] #main \{ min-height:/, 'the page is held at the skeleton height only while hidden');
    assert.doesNotMatch(css, /data-kdl-enter\]\) #main \{ min-height/, 'not while it animates in: the height would jump when the animation ends');
    api.cloak('/none');
    assert.doesNotMatch(style().textContent, /data:image/, 'no snapshot: no skeleton, the content is still hidden');
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
  {
    // A page swapped in by htmx: its skeleton is not drawn unless the page stays hidden for a while
    const { api, cloaked, skeleton } = load();
    api.cloak();
    assert.equal(skeleton(), true, 'a first load shows its skeleton at once');
    api.cloak('/fanbox/user/1', false, 'late');
    assert.equal(skeleton(), false, 'a swapped-in page starts without one');
    api.reveal();
    await delay(160);
    assert.equal(cloaked(), false);
    assert.equal(skeleton(), false, 'shown quickly: the skeleton never appeared');
    api.cloak('/fanbox/user/1', false, 'late');
    await delay(200);
    assert.equal(cloaked(), true);
    assert.equal(skeleton(), true, 'still hidden after a while: the skeleton is drawn');
  }
  {
    // The failsafe asks the guard first: a first load that is still coming in keeps its skeleton
    const { api, cloaked } = load({ failsafeMs: 40 });
    let ready = false;
    let asked = 0;
    api.setCloakFailsafeGuard(() => {
      asked++;
      return !ready;
    });
    const retry = /FAILSAFE_RETRY_MS = (\d+)/.exec(compiled);
    assert.ok(retry, 'the guard is asked again after FAILSAFE_RETRY_MS');
    api.cloak();
    await delay(90);
    assert.equal(cloaked(), true, 'the guard keeps the page hidden past the failsafe');
    assert.equal(asked, 1);
    ready = true;
    await delay(Number(retry[1]) + 60);
    assert.equal(cloaked(), false, 'and it is shown once the guard lets go');
    api.setCloakFailsafeGuard(() => { throw new Error('broken guard'); });
    api.cloak();
    await delay(90);
    assert.equal(cloaked(), false, 'a guard that throws never keeps the page hidden');
  }
  console.log('page cloak checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
