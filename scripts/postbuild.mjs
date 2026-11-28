import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
// Raise when the generated preload userstyle changes, so Stylus offers the update
const PRELOAD_STYLE_VERSION = '2.1.0';
// What the style reports in --kdl-preload: one number, kept in src/ui/components/preloadStyle.ts (the script
// offers an update to installs that report less)
const PRELOAD_STYLE_REVISION = Number(fs.readFileSync(path.join(rootDir, 'src/ui/components/preloadStyle.ts'), 'utf-8').match(/PRELOAD_STYLE_REVISION = (\d+)/)?.[1]);
if (!PRELOAD_STYLE_REVISION) throw new Error('PRELOAD_STYLE_REVISION not found in src/ui/components/preloadStyle.ts');

const indexContent = fs.readFileSync(path.join(rootDir, 'src/index.ts'), 'utf-8');
const headerMatch = indexContent.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
const header = headerMatch ? headerMatch[0] : '';

// --target sleazyfork: the unminified copy for Sleazy Fork / Greasy Fork (vite build --mode sleazyfork). The sites
// strip @updateURL/@downloadURL and accept @require only from known CDNs, so Plyr comes from jsDelivr there,
// together with the libraries that build leaves out to stay under their 2 MB limit (pinned to installed versions)
const sleazy = process.argv.includes('--target') && process.argv[process.argv.indexOf('--target') + 1] === 'sleazyfork';
const installed = (name) => JSON.parse(fs.readFileSync(path.join(rootDir, 'node_modules', name, 'package.json'), 'utf-8')).version;
const scriptHeader = !sleazy ? header : header
  .split('\n')
  .filter((line) => !/^\/\/\s*@(updateURL|downloadURL)\b/.test(line))
  .map((line) => (/^\/\/\s*@require\s+https:\/\/cdn\.plyr\.io\//.test(line)
    ? [
      `// @require      https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.js`,
      `// @require      https://cdn.jsdelivr.net/npm/fflate@${installed('fflate')}/umd/index.js`,
      `// @require      https://cdn.jsdelivr.net/npm/wanakana@${installed('wanakana')}/wanakana.min.js`,
    ].join('\n')
    : line))
  .join('\n');
if (sleazy && !scriptHeader.includes('cdn.jsdelivr.net/npm/fflate')) throw new Error('The Plyr @require line was not found: the Sleazy Fork header would miss its libraries');

const bundlePath = path.join(rootDir, sleazy ? 'dist-sleazyfork/bundle.js' : 'dist/bundle.js');
let bundleCode = fs.readFileSync(bundlePath, 'utf-8');

// AdGuard concatenates every enabled userscript (and their @require files) into one script.
// So the bundle must not depend on what comes before or after it, nor take anything down with it:
// - the leading `;` ends a previous script that left its last statement open,
// - the function scope keeps Vite's `var KemonoDownloadButton` off the shared global scope,
// - try/catch stops our start-up error from aborting the scripts concatenated after us,
// - the flag keeps a second injection into the same page from running everything twice.
const wrap = (scriptHeader) => `${scriptHeader}

;(function () {
  if (window.__kemonoDownloadButtonLoaded) return;
  window.__kemonoDownloadButtonLoaded = true;
  try {
${bundleCode.trim()}
  } catch (error) {
    console.error('[Kemono DL] failed to start', error);
  }
})();
`;

// Copies for other hosts live in builds/: each one updates from where it was installed from
const buildsDir = path.join(rootDir, 'builds');
fs.mkdirSync(buildsDir, { recursive: true });
if (sleazy) {
  fs.writeFileSync(path.join(buildsDir, 'kemono-download-button.sleazyfork.user.js'), wrap(scriptHeader), 'utf-8');
  console.log('Successfully generated:\n - builds/kemono-download-button.sleazyfork.user.js');
  process.exit(0);
}

// Standard single update file for Tampermonkey / Violentmonkey
const permanentUserJs = path.join(rootDir, 'kemono-download-button.user.js');

fs.writeFileSync(permanentUserJs, wrap(scriptHeader), 'utf-8');

// The same script with its update address on another host. jsDelivr serves the repo through a CDN (raw GitHub is
// blocked in some countries; the release workflow purges its cache), the gist mirror is updated by
// scripts/publish-gist.mjs, GitHub Releases carry the copy that follows the latest release, and a Cloudflare
// Worker mirrors the repo for managers that cannot reach GitHub at all.
const REPO = 'bropines/kemono-download-button';
const GIST = 'bropines/d95924125e05f376d5bab737e1ed7463';
const HOSTS = {
  jsdelivr: (file) => `https://cdn.jsdelivr.net/gh/${REPO}@main/builds/${file}`,
  gist: () => `https://gist.githubusercontent.com/${GIST}/raw/kemono-download-button.user.js`,
  release: (file) => `https://github.com/${REPO}/releases/latest/download/${file}`,
  // A Worker on the owner's Cloudflare account (workers.dev) that serves this copy from the repo, cached for 10 min
  cloudflare: () => 'https://kemono-dl.bropines.workers.dev/kemono-download-button.user.js',
};
for (const [host, urlFor] of Object.entries(HOSTS)) {
  const file = `kemono-download-button.${host}.user.js`;
  const url = urlFor(file);
  const hosted = header.replace(/^(\/\/\s*@(?:updateURL|downloadURL)\s+).*$/gm, (_m, key) => key + url);
  if (!hosted.includes(url)) throw new Error(`No @updateURL to point at ${host}`);
  fs.writeFileSync(path.join(buildsDir, file), wrap(hosted), 'utf-8');
}

// The optional preload userstyle shows the same skeletons as the page cloak: the built-in snapshots
// (src/core/skeletons.json, taken with scripts/skeletons.mjs) drawn by src/core/skeleton.ts (transpiled and
// evaluated on its own: it imports types only), one URL section per kind of page, phone and desktop by width.
const ts = (await import('typescript')).default;
const skeletonSource = fs.readFileSync(path.join(rootDir, 'src/core/skeleton.ts'), 'utf-8');
const skeletonModule = { exports: {} };
new Function('exports', 'module', 'require', ts.transpileModule(skeletonSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(skeletonModule.exports, skeletonModule, () => ({}));
const { skeletonBaseCss, snapshotCss } = skeletonModule.exports;
const snapshots = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/core/skeletons.json'), 'utf-8'));
const MOBILE_MAX = 720; // keep in step with skeletonBucket() in src/core/skeletonCapture.ts
const preloadPath = path.join(rootDir, 'extras/kdl-preload.user.css');
const pending = 'html:not([data-kdl-ready]) #main';
const indent = (css, depth = 1) => css.trim().split('\n').map((line) => (line ? `${'  '.repeat(depth)}${line}` : line)).join('\n');
// Whole-URL patterns per route (CSS strings: each \\ is one regex backslash); later sections win, so the more
// specific routes come after the general ones
const site = String.raw`https?://([^/]+\\.)?(kemono\\.(su|cr)|coomer\\.(su|party)|pawchive\\.(pw|st))`;
const tail = String.raw`([/?#].*)?`;
const escape = (segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\\\${c}`);
function routeUrl(route) {
  if (route === 'home') return `${site}/?([?#].*)?`;
  if (route === 'post') return String.raw`${site}/[^/]+/user/[^/]+/post/.*`;
  if (route === 'creator') return String.raw`${site}/[^/]+/user/[^/?#]+/?([?#].*)?`;
  if (route.startsWith('creator-')) return String.raw`${site}/[^/]+/user/[^/?#]+/${escape(route.slice(8))}${tail}`;
  return `${site}/${route.split('-').map(escape).join('/')}${tail}`;
}
const routes = [...new Set(Object.keys(snapshots).map((key) => key.split('|')[0]))]
  .sort((a, b) => a.split('-').length - b.split('-').length || a.localeCompare(b));
const both = (route) => [
  snapshots[`${route}|desktop`] && `@media not all and (max-width: ${MOBILE_MAX}px) {\n${indent(snapshotCss(pending, snapshots[`${route}|desktop`]))}\n}`,
  snapshots[`${route}|mobile`] && `@media (max-width: ${MOBILE_MAX}px) {\n${indent(snapshotCss(pending, snapshots[`${route}|mobile`]))}\n}`,
].filter(Boolean).join('\n');
const sections = routes.map((route) => `/* ${route} */\n@-moz-document regexp("${routeUrl(route)}") {\n${indent(both(route))}\n}`).join('\n\n');
const preloadStyle = `/* ==UserStyle==
@name         Kemono & Pawchive Download Button: no flash on load
@namespace    github.com/bropines/kemono-download-button
@version      ${PRELOAD_STYLE_VERSION}
@homepageURL  https://github.com/bropines/kemono-download-button
@updateURL    https://raw.githubusercontent.com/bropines/kemono-download-button/main/extras/kdl-preload.user.css
@description  Shows a loading skeleton of the redesigned page instead of the site's own layout from the first frame until the userscript has reworked the page (1.5 s at most). Style managers (Stylus, AdGuard) apply this before userscript managers inject scripts.
@author       bropines
@license      MIT
==/UserStyle== */

/* Generated by scripts/postbuild.mjs from src/core/skeletons.json and src/core/skeleton.ts: edit those, not this file. */
@-moz-document domain("kemono.su"), domain("kemono.cr"), domain("coomer.su"), domain("coomer.party"), domain("pawchive.pw"), domain("pawchive.st") {
  /* Lets the userscript see that this style is installed (and which version) */
  html { --kdl-preload: ${PRELOAD_STYLE_REVISION}; }

  /* The userscript sets data-kdl-ready on <html> once the page is reworked; without it (script off or
     broken) the content shows anyway after 1.5 s and the skeleton goes. The children are hidden, not #main:
     a descendant with its own visibility: visible would show through. */
  ${pending} > * { opacity: 0; pointer-events: none; animation: kdl-preload-reveal 0s linear 1.5s forwards; }
${indent(skeletonBaseCss(pending))}
  ${pending}::before, ${pending}::after {
    animation: kdl-skeleton-shimmer 1.8s ease-in-out infinite, kdl-preload-reveal-hide 0s linear 1.5s forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    ${pending}::before, ${pending}::after { animation: kdl-preload-reveal-hide 0s linear 1.5s forwards; }
  }
  @keyframes kdl-preload-reveal { to { opacity: 1; pointer-events: auto; } }
  @keyframes kdl-preload-reveal-hide { to { visibility: hidden; } }

  /* Any other page: the post list's skeleton */
${indent(both('posts'))}
}

${sections}
`;
// Installed copies only update (and the script only offers it) when the revision rises: a style that changed
// under the same revision would stay old for everyone. Compared with the file this build replaces.
{
  const previous = fs.existsSync(preloadPath) ? fs.readFileSync(preloadPath, 'utf-8') : '';
  const body = (css) => css.replace(/^[\s\S]*?==\/UserStyle== \*\//, '').replace(/--kdl-preload: \d+;/, '');
  const oldRevision = Number(previous.match(/--kdl-preload: (\d+);/)?.[1] || 0);
  const oldVersion = previous.match(/@version\s+(\S+)/)?.[1];
  if (previous && body(previous) !== body(preloadStyle) && (PRELOAD_STYLE_REVISION <= oldRevision || PRELOAD_STYLE_VERSION === oldVersion)) {
    console.warn(
      `\n!!! extras/kdl-preload.user.css changed, but its revision (${PRELOAD_STYLE_REVISION}) or @version (${PRELOAD_STYLE_VERSION}) did not.\n` +
        '!!! Raise PRELOAD_STYLE_REVISION in src/ui/components/preloadStyle.ts and PRELOAD_STYLE_VERSION in scripts/postbuild.mjs,\n' +
        '!!! then build again: otherwise Stylus keeps the old style and the script does not offer the update.\n'
    );
  }
}
fs.writeFileSync(preloadPath, preloadStyle, 'utf-8');

console.log(`Successfully generated:\n - ${permanentUserJs}\n - ${preloadPath}`);
