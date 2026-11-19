// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    https://github.com/bropines/kemono-download-button
// @version      1.10.0
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
import { bootEarly } from './core/registry';
import { ensureStylesInjected } from './modules/core';
import { installLanguageRuntime } from './i18n/live';

export { ensureStylesInjected };

ensureStylesInjected();
migrateLegacyKeys();
registerBuiltinModules();
// The script starts with the document: styles go in before the first paint, the rest waits for the DOM
bootEarly();

// Styles injected at document-start sit before the site's own stylesheets; move them after, as they used to be,
// so equal-specificity rules keep winning (user theme sheets stay last: they are re-appended in the same order)
function moveOwnStylesLast(): void {
  const head = document.head || document.documentElement;
  document.querySelectorAll<HTMLStyleElement>('style[id^="kdl-"], style[id^="kui-"], style[data-kdl-style]').forEach((style) => head.appendChild(style));
}

function init(): void {
  moveOwnStylesLast();
  startRouter();
  installLanguageRuntime();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
