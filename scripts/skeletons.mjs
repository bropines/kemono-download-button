// Built-in loading skeletons: snapshots of real pages, taken with the same capture code the userscript runs
// (src/core/skeletonCapture.ts). Re-take them when the redesign's layout changes:
//
//   node scripts/skeletons.mjs inject          writes .skeleton-capture/capture.js: a function to evaluate in
//                                              the page (e.g. chrome-devtools evaluate_script with sourcePath);
//                                              it waits 2.5 s, captures, and returns { route, bucket, snap }.
//                                              Save each result as .skeleton-capture/<anything>.json
//                                              (desktop window, then a phone viewport, per page kind).
//   node scripts/skeletons.mjs inject-all [desktop|mobile|all] [/page,/page]  writes .skeleton-capture/capture-<size|all>.js: evaluated on any page of the
//                                              site, it loads every page kind of PAGES in an iframe at a desktop
//                                              and a phone size, captures each and returns them all (save it as
//                                              .skeleton-capture/all.json). Edit PAGES for the creator/post used.
//   node scripts/skeletons.mjs preview <file|route|bucket>  writes .skeleton-capture/preview.js: evaluating it shows that
//                                              snapshot as the skeleton over the current page.
//   node scripts/skeletons.mjs merge           collects .skeleton-capture/*.json into src/core/skeletons.json
//                                              (keys "<route>|<bucket>"); then npm run build.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, '.skeleton-capture');
const transpile = (file) => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf-8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
fs.mkdirSync(dir, { recursive: true });

// Pages to capture, relative to the site the capture runs on
const PAGES = [
  '/', '/posts', '/posts/popular', '/posts/tags', '/artists', '/artists/updated', '/missing', '/dms', '/search_hash',
  '/importer', '/importer/tutorial', '/account', '/account/keys', '/account/review_dms', '/favorites',
  '/fanbox/user/105198068', '/fanbox/user/105198068/fancards', '/fanbox/user/105198068/announcements',
  '/fanbox/user/105198068/links', '/fanbox/user/105198068/recommended', '/fanbox/user/105198068/post/12952301',
];
const SIZES = { desktop: [1700, 990], mobile: [390, 844] };

const [command, arg, only] = process.argv.slice(2);
if (command === 'inject-all') {
  // One file per screen class: a run takes ~4 s per page
  const sizes = arg && arg !== 'all' ? [SIZES[arg]] : Object.values(SIZES);
  // Optional: a comma-separated list of pages to re-take instead of all of PAGES
  const pages = only ? only.split(',') : PAGES;
  const js = transpile('src/core/skeletonCapture.ts');
  fs.writeFileSync(path.join(dir, `capture-${arg ?? 'all'}.js`), `async () => {
  const code = ${JSON.stringify(js)};
  const results = [];
  for (const [width, height] of ${JSON.stringify(sizes)}) {
    for (const page of ${JSON.stringify(pages)}) {
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;left:0;top:0;border:0;opacity:0.01;pointer-events:none;z-index:-1;width:' + width + 'px;height:' + height + 'px';
      const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
      frame.src = page;
      document.body.appendChild(frame);
      await loaded;
      // The userscript, its API blocks (similar creators, overview) and lazy layout settle
      await new Promise((resolve) => setTimeout(resolve, 3500));
      try {
        const win = frame.contentWindow;
        const exports = {};
        new win.Function('exports', code)(exports);
        results.push({ page, route: exports.skeletonRoute(win.location.pathname), bucket: exports.skeletonBucket(win.innerWidth), width: win.innerWidth, snap: exports.captureSkeleton(win.document.querySelector('#main')) });
      } catch (error) {
        results.push({ page, error: String(error) });
      }
      frame.remove();
    }
  }
  return results;
}`);
  console.log(`wrote .skeleton-capture/capture-${arg ?? 'all'}.js (${pages.length} pages x ${sizes.length} sizes)`);
} else if (command === 'inject') {
  const js = transpile('src/core/skeletonCapture.ts');
  fs.writeFileSync(path.join(dir, 'capture.js'), `async () => { await new Promise((r) => setTimeout(r, 2500)); window.scrollTo(0, 0); const exports = {}; ${js}; return { route: exports.skeletonRoute(), bucket: exports.skeletonBucket(), width: innerWidth, snap: exports.captureSkeleton() }; }`);
  console.log('wrote .skeleton-capture/capture.js');
} else if (command === 'preview') {
  // A capture file, or a "<route>|<bucket>" key of src/core/skeletons.json
  const snap = arg.includes('|')
    ? JSON.parse(fs.readFileSync(path.join(root, 'src/core/skeletons.json'), 'utf-8'))[arg]
    : JSON.parse(fs.readFileSync(path.resolve(arg), 'utf-8').replace(/^[^{]*/, '')).snap;
  const exports = {};
  new Function('exports', 'require', transpile('src/core/skeleton.ts'))(exports, () => ({}));
  const scope = 'html[data-kdl-cloak] #main';
  const css = [`${scope} > * { opacity: 0 !important; }`, exports.skeletonBaseCss(scope), exports.snapshotCss(scope, snap)].join('\n');
  fs.writeFileSync(path.join(dir, 'preview.js'), `() => { document.getElementById('kdl-cloak-style')?.remove(); document.getElementById('kdl-preview')?.remove(); const s = document.createElement('style'); s.id = 'kdl-preview'; s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); window.scrollTo(0, 0); document.documentElement.setAttribute('data-kdl-cloak', ''); return ${css.length}; }`);
  console.log(`wrote .skeleton-capture/preview.js (${css.length} bytes of CSS)`);
} else if (command === 'merge') {
  const out = {};
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith('.json')).sort()) {
    const raw = fs.readFileSync(path.join(dir, name), 'utf-8');
    const start = raw.search(/[[{]/);
    const parsed = JSON.parse(raw.slice(start));
    for (const { route, bucket, snap, page, error } of Array.isArray(parsed) ? parsed : [parsed]) {
      if (!snap) { console.warn(`skipped ${page ?? name}: ${error ?? 'no snapshot'}`); continue; }
      out[`${route}|${bucket}`] = snap;
    }
  }
  fs.writeFileSync(path.join(root, 'src/core/skeletons.json'), `${JSON.stringify(out)}\n`);
  console.log(`src/core/skeletons.json: ${Object.keys(out).length} snapshots, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
} else {
  console.error('usage: node scripts/skeletons.mjs inject | preview <file> | merge');
  process.exit(1);
}
