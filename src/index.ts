// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.8.29
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
import { fetchUserFavorites } from './api/kemonoApi';
import { el } from './utils/dom';
import { debugLog, waitForElement } from './utils/helpers';
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
import { fetchAndCachePostData } from './services/collectorService';

export function ensureStylesInjected(): void {
  if (document.getElementById('kdl-global-styles')) return;

  if (typeof GM_addStyle === 'function') {
    const styleNode = GM_addStyle(CSS_STYLES);
    if (styleNode && typeof (styleNode as any).setAttribute === 'function') {
      (styleNode as any).setAttribute('id', 'kdl-global-styles');
    }
  } else {
    const styleNode = document.createElement('style');
    styleNode.id = 'kdl-global-styles';
    styleNode.textContent = CSS_STYLES;
    (document.head || document.documentElement).appendChild(styleNode);
  }
}

ensureStylesInjected();

let lastUrl = '';
let isInitializing = false;

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

async function handlePageContent(): Promise<void> {
  try {
    await getSettings();
    await fetchUserFavorites();

    appState.cachedPostFiles = null;
    appState.originalPostContentHTML = null;
    appState.selectedPostIds.clear();

    document
      .querySelectorAll('.kdl-button, .post-card-download-controls, #kdl-bulk-panel, .kdl-post-checkbox, #kdl-author-manager-btn, .kdl-quick-fav-btn')
      .forEach((el2) => el2.remove());

    const path = window.location.pathname;

    if (path.includes('/post/')) {
      let header = document.querySelector('.post__header');
      let actionsDiv = document.querySelector('.post__actions');

      if (!actionsDiv && header) {
        actionsDiv = el('div', { className: 'post__actions' });
        header.appendChild(actionsDiv);
      }

      if (header) {
        await createAndInsertPostPageButtons(header as HTMLElement);
        fetchAndCachePostData();
      }
    } else if (path.includes('/user/')) {
      const userHeaderActions = document.querySelector('.user-header__actions');
      if (userHeaderActions) {
        userHeaderActions.prepend(createAuthorManagerButton());
      }

      createBulkDownloadPanel();
      const pageAuthorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';

      document.querySelectorAll('article.post-card[data-id]').forEach((cardNode) => {
        const card = cardNode as HTMLElement;
        injectPostCardButtons(card, pageAuthorName);

        if (!card.querySelector('.kdl-post-checkbox')) {
          const checkbox = el('input', {
            type: 'checkbox',
            className: 'kdl-post-checkbox',
            dataset: { id: card.dataset.id },
            onClick: (e: MouseEvent) => e.stopPropagation()
          });
          card.appendChild(checkbox);
        }

        card.addEventListener('click', (event: MouseEvent) => {
          if (event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
            (card.querySelector('.kdl-post-checkbox') as HTMLElement | null)?.click();
          }
        });
      });
    } else if (path.startsWith('/artists') || path.startsWith('/creators')) {
      document.querySelectorAll('a.user-card[data-id][data-service]').forEach((c) => injectArtistFavoriteButton(c as HTMLElement));
    } else if (path.startsWith('/posts') || path === '/') {
      document.querySelectorAll('article.post-card[data-id][data-user][data-service]').forEach((c) => injectPostFavoriteButton(c as HTMLElement));
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

  if (isInitializing) return;
  const currentUrl = window.location.href;
  const path = window.location.pathname;

  const isPostPage = path.includes('/post/');
  const isUserPage = path.includes('/user/');
  const isPostsListPage = path.startsWith('/posts') || path === '/';
  const isArtistsListPage = path.startsWith('/artists') || path.startsWith('/creators');

  if (!isPostPage && !isUserPage && !isPostsListPage && !isArtistsListPage) {
    lastUrl = currentUrl;
    return;
  }

  const buttonsExist = isPostPage ? document.querySelector('.kdl-button') : document.querySelector('#kdl-bulk-panel');
  if (!force && buttonsExist && currentUrl === lastUrl) {
    if (isUserPage) initializeShiftClickLogic();
    return;
  }

  isInitializing = true;
  debugLog(`Running initialization for PWA/SPA page: ${currentUrl}`);

  try {
    if (isPostPage) await waitForElement('.post__actions');
    else if (isUserPage) await waitForElement('.card-list');

    await handlePageContent();
    runKuiPageLogic();
    lastUrl = currentUrl;

    if (isUserPage) initializeShiftClickLogic();
  } catch (error) {
    debugLog('Initialization error or timeout:', error);
  } finally {
    isInitializing = false;
  }
};

function init(): void {
  ensureStylesInjected();
  debugModule.init();
  injectUI();
  lightboxModule.init();
  setupGlobalClickListener();
  createFixedControls();

  runInitializationLogic();

  // HTMX & PWA SPA Navigation Listeners
  document.addEventListener("htmx:beforeHistorySave", () => postPageModule.cleanup());
  document.addEventListener("htmx:beforeSwap", () => postPageModule.cleanup());
  document.addEventListener("htmx:beforeRequest", () => postPageModule.cleanup());
  document.addEventListener("htmx:beforeCleanupElement", () => postPageModule.cleanup());
  document.addEventListener('htmx:afterSettle', () => runInitializationLogic(true));
  document.addEventListener('htmx:afterSwap', () => runInitializationLogic(true));
  document.addEventListener('htmx:historyRestore', () => runInitializationLogic(true));
  window.addEventListener('popstate', () => {
    postPageModule.cleanup();
    runInitializationLogic(true);
  });

  // Intercept PushState and ReplaceState for SPA/PWA client routing
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    postPageModule.cleanup();
    originalPushState.apply(this, args);
    setTimeout(() => runInitializationLogic(true), 50);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    postPageModule.cleanup();
    originalReplaceState.apply(this, args);
    setTimeout(() => runInitializationLogic(true), 50);
  };

  let observerTimeout: any = null;
  const observer = new MutationObserver(() => {
    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      if (window.location.href !== lastUrl || !document.querySelector('.kdl-button, #kdl-bulk-panel')) {
        runInitializationLogic();
      }
    }, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
