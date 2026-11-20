import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
// Raise when the generated preload userstyle changes, so Stylus offers the update
const PRELOAD_STYLE_VERSION = '2.0.0';
// What the style reports in --kdl-preload: one number, kept in src/ui/components/preloadStyle.ts (the script
// offers an update to installs that report less)
const PRELOAD_STYLE_REVISION = Number(fs.readFileSync(path.join(rootDir, 'src/ui/components/preloadStyle.ts'), 'utf-8').match(/PRELOAD_STYLE_REVISION = (\d+)/)?.[1]);
if (!PRELOAD_STYLE_REVISION) throw new Error('PRELOAD_STYLE_REVISION not found in src/ui/components/preloadStyle.ts');

const indexContent = fs.readFileSync(path.join(rootDir, 'src/index.ts'), 'utf-8');
const headerMatch = indexContent.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
const header = headerMatch ? headerMatch[0] : '';

const bundlePath = path.join(rootDir, 'dist/bundle.js');
let bundleCode = fs.readFileSync(bundlePath, 'utf-8');

// AdGuard concatenates every enabled userscript (and their @require files) into one script.
// So the bundle must not depend on what comes before or after it, nor take anything down with it:
// - the leading `;` ends a previous script that left its last statement open,
// - the function scope keeps Vite's `var KemonoDownloadButton` off the shared global scope,
// - try/catch stops our start-up error from aborting the scripts concatenated after us,
// - the flag keeps a second injection into the same page from running everything twice.
const finalScript = `${header}

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

// Standard single update file for Tampermonkey / Violentmonkey
const permanentUserJs = path.join(rootDir, 'kemono-download-button.user.js');

fs.writeFileSync(permanentUserJs, finalScript, 'utf-8');

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
@description  Shows a loading skeleton of the redesigned page instead of the site's own layout from the first frame until the userscript has reworked the page (1.5 s at most). Style managers (Stylus) apply this before userscript managers inject scripts.
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
fs.writeFileSync(preloadPath, preloadStyle, 'utf-8');

console.log(`Successfully generated:\n - ${permanentUserJs}\n - ${preloadPath}`);
