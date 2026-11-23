// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    https://github.com/bropines/kemono-download-button
// @version      2.0.115
// @author       hoami_523 + Gemini + bropines
// @description  Kemono, Coomer, and Pawchive Download Button & UI Refactor
// @icon         https://kemono.cr/static/favicon.ico
// @updateURL    https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
// @downloadURL  https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
// @match        https://kemono.su/*
// @match        https://*.kemono.su/*
// @match        https://kemono.cr/*
// @match        https://*.kemono.cr/*
// @match        https://coomer.su/*
// @match        https://*.coomer.su/*
// @match        https://coomer.party/*
// @match        https://*.coomer.party/*
// @match        https://pawchive.pw/*
// @match        https://*.pawchive.pw/*
// @match        https://pawchive.st/*
// @match        https://*.pawchive.st/*
// @require      https://cdn.plyr.io/3.7.8/plyr.js
// @connect      *
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

// Everything page-related is a module (src/modules, src/core/README.md): the router mounts the ones that
// match the current page and site, updates them on batched mutations and unmounts them on navigation
import { startRouter } from './core/router';
import { migrateLegacyKeys } from './core/storage';
import { registerBuiltinModules } from './modules';
import { bootEarly, isModuleEnabled } from './core/registry';
import { cloak, cloaksWithoutRedesign, reveal, setCloakFailsafeGuard } from './core/cloak';
import { scheduleSkeletonCapture } from './core/skeletonStore';
import { isPreloadStyleInstalled } from './ui/components/preloadStyle';
import { ensureStylesInjected } from './modules/core';
import { installLanguageRuntime } from './i18n/live';

export { ensureStylesInjected };

ensureStylesInjected();
migrateLegacyKeys();
registerBuiltinModules();
// The script starts with the document: styles go in before the first paint, the rest waits for the DOM
bootEarly();
// With the redesign on, the page content stays hidden until the modules have reworked it (src/core/cloak.ts).
// Only while nothing is painted yet: a manager that injects late (after <body> exists) must not hide a page
// the user already sees.
// With the preload userstyle the page is hidden from the first frame anyway, so the cloak (and its short wait
// for cached blocks) applies however late the manager injected us, until the first reveal.
if (isModuleEnabled('ui.shadcn')) {
  const preload = isPreloadStyleInstalled();
  // Under the userstyle, keep drawing its skeleton (the built-in one) rather than switching to another
  if (!document.body || preload) cloak(window.location.pathname, preload);
} else if (!document.body && cloaksWithoutRedesign(window.location.pathname)) {
  cloak(window.location.pathname, false, 'none');
}

// Styles injected at document-start sit before the site's own stylesheets; move them after, as they used to be,
// so equal-specificity rules keep winning (user theme sheets stay last: they are re-appended in the same order)
function moveOwnStylesLast(): void {
  const head = document.head || document.documentElement;
  document.querySelectorAll<HTMLStyleElement>('style[id^="kdl-"], style[id^="kui-"], style[data-kdl-style]').forEach((style) => head.appendChild(style));
}

let booted = false;

function init(): void {
  if (booted) return;
  booted = true;
  moveOwnStylesLast();
  try {
    startRouter();
    installLanguageRuntime();
  } finally {
    reveal();
    if (isModuleEnabled('ui.shadcn')) scheduleSkeletonCapture();
  }
}

// A slow first load. The cloak's failsafe (2.5 s) is there so a page is never left hidden, but on a slow
// connection that moment comes before the modules have mounted, and the page showed half-parsed and not yet
// reworked, then jumped into place. So when it is due and we have not started yet:
// - the document is parsed, only the site's deferred scripts are still loading: start now, without waiting
//   for them (DOMContentLoaded), and let the page be shown as usual;
// - the document is still coming in: the skeleton stays, up to FIRST_LOAD_MAX_MS since the script started.
// Once started, the failsafe is what it was: whatever keeps the page hidden then, it is shown.
const FIRST_LOAD_MAX_MS = 10000;
const startedAt = performance.now();
setCloakFailsafeGuard(() => {
  if (booted) return false;
  if (document.readyState !== 'loading') {
    init();
    return true;
  }
  return performance.now() - startedAt < FIRST_LOAD_MAX_MS;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
