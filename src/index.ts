// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.9.1
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
// ==/UserScript==

import { CSS_STYLES } from './config/styles';
import { SELECTORS } from './config/selectors';
import { getSettings, appState } from './state/store';
import { kuiState } from './state/kuiState';
import { getApiAdapter } from './api';
import { el } from './utils/dom';
import { debugLog } from './utils/helpers';
import { debugModule } from './utils/logger';
import { sanitizeDuplicates } from './utils/domChecker';
import { createFixedControls } from './ui/components/fixedControls';
import { setupNavigationSettings } from './ui/components/navigationSettings';
import { createAndInsertPostPageButtons } from './ui/components/postPageButtons';
import { injectPostCardButtons, injectArtistFavoriteButton, injectPostFavoriteButton } from './ui/components/postCardButtons';
import { createBulkDownloadPanel, initializeShiftClickLogic } from './ui/components/bulkPanel';
import { createAuthorManagerButton } from './ui/components/authorManagerModal';
import { injectUI } from './ui/components/kui/settingsPanel';
import { setupGridControls } from './ui/components/kui/gridControls';
import { lightboxModule } from './features/kui/lightbox';
import { markViewedPosts, setupGlobalClickListener } from './features/kui/viewedPosts';
import { userPageModule } from './features/kui/userPageModule';
import { postPageModule } from './features/kui/postPageModule';
import { fetchAndCachePostData, getPostDetailsFromPage } from './services/collectorService';
import { applyAdBlock } from './features/adblock';
import { toggleSettingsModal } from './ui/components/settingsModal';
import { initializeComments } from './features/kui/comments';
import { hideEmptySections } from './features/kui/embeds';
import { initializePostTranslation } from './features/kui/translateButtons';

const STYLE_ID = 'kdl-global-styles';
let stylesInjected = false;
let styleElement: HTMLStyleElement | null = null;

export function ensureStylesInjected(): void {
  if (stylesInjected) {
    // Re-attach our own node if the page dropped it, never inject a second copy
    if (styleElement && !styleElement.isConnected) (document.head || document.documentElement).appendChild(styleElement);
    return;
  }
  stylesInjected = true;

  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    styleElement = existing;
    return;
  }

  if (typeof GM_addStyle === 'function') {
    try {
      const result = GM_addStyle(CSS_STYLES) as unknown;
      // Some hosts return nothing: find the node they added so it still gets the id
      styleElement =
        result instanceof HTMLStyleElement
          ? result
          : Array.from(document.querySelectorAll('style')).find((node) => node.textContent === CSS_STYLES) || null;
      if (styleElement) styleElement.id = STYLE_ID;
      return;
    } catch (error) {
      debugLog('GM_addStyle failed, falling back to a <style> element:', error);
    }
  }

  styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = CSS_STYLES;
  (document.head || document.documentElement).appendChild(styleElement);
}

ensureStylesInjected();

let lastUrl = '';
let lastPathname = '';
let favoritesLoad: Promise<boolean> | null = null;
let isInitializing = false;
let pendingForcedInit = false;
let scheduledInitTimer: ReturnType<typeof setTimeout> | null = null;
let scheduledInitForce = false;

function runKuiPageLogic(): void {
  try {
    const postBody = document.querySelector(SELECTORS.postBody);
    const isOnPostPage = !!document.querySelector(SELECTORS.postPageContainer);
    const isOnUserPage = !!document.querySelector(SELECTORS.userHeaderName);

    if (isOnPostPage && postBody) {
      if (!postBody.classList.contains("kui-processed") || !kuiState.isPostPageModuleActive) {
        postPageModule.init();
      }
    } else {
      if (kuiState.isPostPageModuleActive) {
        postPageModule.cleanup();
      }
    }

    if (isOnUserPage) {
      userPageModule.init();
    }

    if (document.querySelector(SELECTORS.postCard)) {
      markViewedPosts();
    }

    setupGridControls();
    sanitizeDuplicates();
  } catch (error) {
    debugLog('Error during KUI page logic execution:', error);
  }
}

type PageType = 'post' | 'user' | 'posts' | 'artists' | 'other';

// Marks site containers/cards we already handled, so re-inits only touch new ones
const PROCESSED_ATTR = 'data-kdl-processed';
const UNPROCESSED = `:not([${PROCESSED_ATTR}])`;
const USER_POST_CARDS = 'article.post-card[data-id]';
const LIST_POST_CARDS = 'article.post-card[data-id][data-user][data-service]';
const ARTIST_CARDS = 'a.user-card';

function getPageType(path = window.location.pathname): PageType {
  if (path.includes('/post/')) return 'post';
  if (path.includes('/user/')) return 'user';
  if (path.startsWith('/posts') || path === '/') return 'posts';
  if (path.startsWith('/artists') || path.startsWith('/creators')) return 'artists';
  return 'other';
}

// True only when something this page type should carry is missing; an empty page never asks for a re-run
function needsInjection(pageType: PageType): boolean {
  const path = window.location.pathname;
  switch (pageType) {
    case 'post': {
      if (!document.querySelector('.post__header')) return false;
      const actions = document.querySelector<HTMLElement>('.kdl-actions-container');
      return !actions || actions.dataset.kdlPath !== path;
    }
    case 'user': {
      const headerActions = document.querySelector('.user-header__actions');
      return (
        !!document.querySelector(USER_POST_CARDS + UNPROCESSED) ||
        (!!document.querySelector('.card-list') && !document.getElementById('kdl-bulk-panel')) ||
        (!!headerActions && !headerActions.querySelector('#kdl-author-manager-btn'))
      );
    }
    case 'posts':
      return !!document.querySelector(LIST_POST_CARDS + UNPROCESSED);
    case 'artists':
      return !!document.querySelector(ARTIST_CARDS + UNPROCESSED);
    default:
      return false;
  }
}

// A node is ours when its id or any class carries the kdl-/kui- prefix. For ancestors only a *leading*
// prefix counts: site elements get marker classes such as `kui-processed` appended after their own
const OWN_NODE = '[id^="kdl-"], [id^="kui-"], [class^="kdl-"], [class*=" kdl-"], [class^="kui-"], [class*=" kui-"]';
const OWN_ANCESTOR = '[id^="kdl-"], [id^="kui-"], [class^="kdl-"], [class^="kui-"]';

function isOwnNode(node: Node): boolean {
  return node instanceof Element ? node.matches(OWN_NODE) : false;
}

function isOwnMutation(mutation: MutationRecord): boolean {
  const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
  if (target?.closest(OWN_ANCESTOR)) return true;
  const changed = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)];
  return changed.length > 0 && changed.every(isOwnNode);
}

// One favorites request per page load: a failed (e.g. 401) fetch is not retried and does not re-toast
function loadFavoritesOnce(): Promise<boolean> {
  if (!favoritesLoad) favoritesLoad = getApiAdapter().fetchUserFavorites().catch(() => false);
  return favoritesLoad;
}

// A new pathname is a different post/creator/list: drop page-scoped state. Query/hash changes keep it
function resetPageState(): void {
  appState.cachedPostFiles = null;
  appState.originalPostContentHTML = null;
  appState.selectedPostIds.clear();
  document.getElementById('kdl-bulk-panel')?.remove();
}

// htmx history snapshots bring our nodes and markers back without their listeners: strip them so they get rebuilt
function stripRestoredInjections(): void {
  document
    .querySelectorAll('.post-card-download-controls, .kdl-post-info-tooltip, .kdl-post-checkbox, .kdl-quick-fav-btn, .kdl-actions-container, #kdl-author-manager-btn')
    .forEach((node) => node.remove());
  document
    .querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}], [data-kdl-card-buttons], [data-kdl-ctrl-click-bound], [data-kdl-shift-click-bound]`)
    .forEach((node) => {
      node.removeAttribute(PROCESSED_ATTR);
      delete node.dataset.kdlCardButtons;
      delete node.dataset.kdlCtrlClickBound;
      delete node.dataset.kdlShiftClickBound;
    });
}

function injectUserPostCard(card: HTMLElement, pageAuthorName: string): void {
  card.setAttribute(PROCESSED_ATTR, 'true');
  injectPostCardButtons(card, pageAuthorName).catch((error) => debugLog('Post card buttons failed:', error));

  if (!card.querySelector('.kdl-post-checkbox')) {
    const id = card.dataset.id;
    const checkbox = el('input', {
      type: 'checkbox',
      className: 'kdl-post-checkbox',
      dataset: { id },
      onClick: (e: MouseEvent) => e.stopPropagation()
    }) as HTMLInputElement;
    // Cards re-rendered by a swap keep their selection
    checkbox.checked = !!id && appState.selectedPostIds.has(id);
    card.appendChild(checkbox);
  }

  if (!card.dataset.kdlCtrlClickBound) {
    card.dataset.kdlCtrlClickBound = 'true';
    card.addEventListener('click', (event: MouseEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        (card.querySelector('.kdl-post-checkbox') as HTMLElement | null)?.click();
      }
    });
  }
}

// Idempotent: injects only into containers/cards not handled yet, never deletes and recreates
async function handlePageContent(pageType: PageType): Promise<void> {
  try {
    await getSettings();
    const path = window.location.pathname;

    if (pageType === 'post') {
      const header = document.querySelector('.post__header');
      if (!header || !needsInjection('post')) return;
      if (!document.querySelector('.post__actions')) header.appendChild(el('div', { className: 'post__actions' }));

      await createAndInsertPostPageButtons(header as HTMLElement);
      const actions = document.querySelector<HTMLElement>('.kdl-actions-container');
      if (actions) actions.dataset.kdlPath = path;
      const { service, userID, postID } = getPostDetailsFromPage();
      fetchAndCachePostData(service, userID, postID).catch((error) => debugLog('Post data prefetch failed:', error));
    } else if (pageType === 'user') {
      const userHeaderActions = document.querySelector('.user-header__actions');
      if (userHeaderActions && !userHeaderActions.querySelector('#kdl-author-manager-btn')) {
        userHeaderActions.prepend(createAuthorManagerButton());
      }

      createBulkDownloadPanel();
      const pageAuthorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';
      document.querySelectorAll<HTMLElement>(USER_POST_CARDS + UNPROCESSED).forEach((card) => injectUserPostCard(card, pageAuthorName));
    } else if (pageType === 'artists') {
      await loadFavoritesOnce();
      document.querySelectorAll<HTMLElement>(ARTIST_CARDS + UNPROCESSED).forEach((card) => {
        card.setAttribute(PROCESSED_ATTR, 'true');
        injectArtistFavoriteButton(card);
      });
    } else if (pageType === 'posts') {
      await loadFavoritesOnce();
      document.querySelectorAll<HTMLElement>(LIST_POST_CARDS + UNPROCESSED).forEach((card) => {
        card.setAttribute(PROCESSED_ATTR, 'true');
        injectPostFavoriteButton(card);
      });
    }
  } catch (error) {
    console.error('Error during page content handling:', error);
  }
}

const runInitializationLogic = async (force = false) => {
  ensureStylesInjected();
  injectUI();
  setupNavigationSettings();
  createFixedControls();
  runKuiPageLogic();

  if (isInitializing) {
    // A navigation (or new cards) landing while a run is in flight must not be dropped;
    // the follow-up run is idempotent, so it settles after one pass
    pendingForcedInit = true;
    return;
  }
  const currentUrl = window.location.href;
  const path = window.location.pathname;
  const pageType = getPageType(path);

  if (path !== lastPathname) {
    if (lastPathname) resetPageState();
    lastPathname = path;
  }

  if (pageType === 'other') {
    lastUrl = currentUrl;
    return;
  }

  // `force` (htmx/history events) only re-checks; injection itself stays limited to what is missing
  if (!force && currentUrl === lastUrl && !needsInjection(pageType)) {
    if (pageType === 'user') initializeShiftClickLogic();
    return;
  }

  isInitializing = true;
  debugLog(`Running initialization for PWA/SPA page: ${currentUrl}`);

  try {
    await handlePageContent(pageType);
    runKuiPageLogic();
    lastUrl = currentUrl;

    if (pageType === 'user') initializeShiftClickLogic();
  } catch (error) {
    debugLog('Initialization error:', error);
  } finally {
    isInitializing = false;
    if (pendingForcedInit) {
      pendingForcedInit = false;
      scheduleInit(true);
    }
  }
};

// One htmx navigation fires afterSwap, afterSettle and pushState: coalesce them into a single run
function scheduleInit(force = false, delay = 50): void {
  scheduledInitForce = scheduledInitForce || force;
  if (scheduledInitTimer) clearTimeout(scheduledInitTimer);
  scheduledInitTimer = setTimeout(() => {
    const runForced = scheduledInitForce;
    scheduledInitTimer = null;
    scheduledInitForce = false;
    runInitializationLogic(runForced);
  }, delay);
}

// Settings stay reachable from the userscript manager menu even when the page layout hides our buttons
function registerMenuCommands(): void {
  if (typeof GM_registerMenuCommand !== 'function') return;
  GM_registerMenuCommand('Download settings', () => toggleSettingsModal(true));
  GM_registerMenuCommand('UI settings', () => document.getElementById('kui-settings-panel')?.classList.add('kui-panel-active'));
}

function init(): void {
  ensureStylesInjected();
  applyAdBlock();
  debugModule.init();
  injectUI();
  lightboxModule.init();
  setupGlobalClickListener();
  createFixedControls();
  registerMenuCommands();

  runInitializationLogic();

  // HTMX & PWA SPA Navigation Listeners
  // Tear the post page down only when a swap really replaces it: any other htmx request
  // (favorite, comments, pagination) used to kill the video player and gallery mid-use
  const swapReplacesPost = (event: Event) => {
    const target = (event as CustomEvent).detail?.target as Element | undefined;
    const postBody = document.querySelector(SELECTORS.postBody);
    return !target || !postBody || target.contains(postBody);
  };
  document.addEventListener("htmx:beforeHistorySave", () => postPageModule.cleanup());
  document.addEventListener("htmx:beforeSwap", (event) => {
    if (swapReplacesPost(event)) postPageModule.cleanup();
  });
  document.addEventListener('htmx:afterSettle', () => scheduleInit(true));
  document.addEventListener('htmx:afterSwap', () => scheduleInit(true));
  document.addEventListener('htmx:historyRestore', () => {
    stripRestoredInjections();
    scheduleInit(true);
  });
  window.addEventListener('popstate', () => {
    postPageModule.cleanup();
    scheduleInit(true);
  });

  // Intercept PushState and ReplaceState for SPA/PWA client routing
  // Query/hash-only updates keep the current post (and a playing video) alive
  const changesPath = (url?: string | URL | null) =>
    url != null && new URL(String(url), window.location.href).pathname !== window.location.pathname;

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    if (changesPath(args[2])) postPageModule.cleanup();
    originalPushState.apply(this, args);
    scheduleInit(true);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    if (changesPath(args[2])) postPageModule.cleanup();
    originalReplaceState.apply(this, args);
    scheduleInit(true);
  };

  let observerTimeout: ReturnType<typeof setTimeout> | null = null;
  const observer = new MutationObserver((mutations) => {
    // Our own injections must never wake the observer, or every init schedules the next one
    if (mutations.every(isOwnMutation)) return;
    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      if (window.location.href !== lastUrl || needsInjection(getPageType())) {
        runInitializationLogic();
      }
      // Comments can render after the post (kemono SPA) or get re-rendered by the site;
      // translate buttons also follow settings that load after the first init
      initializeComments();
      initializePostTranslation();
      hideEmptySections();
    }, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
