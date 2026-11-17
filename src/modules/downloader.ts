import type { KdlModule } from '../core/types';
import { getSettings, appState } from '../state/store';
import { getApiAdapter } from '../api';
import { el } from '../utils/dom';
import { debugLog } from '../utils/helpers';
import { createAndInsertPostPageButtons } from '../ui/components/postPageButtons';
import { injectPostCardButtons, injectArtistFavoriteButton, injectPostFavoriteButton } from '../ui/components/postCardButtons';
import { createBulkDownloadPanel, initializeShiftClickLogic } from '../ui/components/bulkPanel';
import { createAuthorManagerButton } from '../ui/components/authorManagerModal';
import { fetchAndCachePostData, getPostDetailsFromPage } from '../services/collectorService';

// Marks site containers/cards we already handled, so updates only touch new ones (never delete and recreate)
const PROCESSED_ATTR = 'data-kdl-processed';
const UNPROCESSED = `:not([${PROCESSED_ATTR}])`;
const USER_POST_CARDS = 'article.post-card[data-id]';
const LIST_POST_CARDS = 'article.post-card[data-id][data-user][data-service]';
const ARTIST_CARDS = 'a.user-card';

const POST_NODES = '.kdl-actions-container, .kdl-button';
const CREATOR_NODES = '.post-card-download-controls, .kdl-post-info-tooltip, .kdl-post-checkbox, #kdl-author-manager-btn';
const FAVORITE_NODES = '.kdl-quick-fav-btn';

// One run at a time; a request landing mid-run triggers exactly one follow-up (the run is idempotent).
// Nothing runs once the module is unmounted, so a slow getSettings() cannot inject into the next page
function serialRunner(isActive: () => boolean, task: () => Promise<void>): () => void {
  let running = false;
  let pending = false;
  const run = async (): Promise<void> => {
    if (!isActive()) return;
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await task();
    } catch (error) {
      debugLog('Downloader injection failed:', error);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        run();
      }
    }
  };
  return () => void run();
}

let restoreGuardInstalled = false;

// Snapshots from older versions (or taken without beforeSnapshot) bring our nodes and markers back without
// their listeners: strip them before the router's reconcile so the mounted modules rebuild them
function installRestoreGuard(): void {
  if (restoreGuardInstalled) return;
  restoreGuardInstalled = true;
  document.addEventListener('htmx:historyRestore', () => stripAllInjections(true));
}

function clearMarkers(selector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    node.removeAttribute(PROCESSED_ATTR);
    delete node.dataset.kdlCardButtons;
  });
}

// ---- downloader.post ----

let postActive = false;

function postNeedsInjection(): boolean {
  if (!document.querySelector('.post__header')) return false;
  const actions = document.querySelector<HTMLElement>('.kdl-actions-container');
  return !actions || actions.dataset.kdlPath !== window.location.pathname;
}

const injectPost = serialRunner(
  () => postActive,
  async () => {
    if (!postNeedsInjection()) return;
    await getSettings();
    const header = document.querySelector<HTMLElement>('.post__header');
    if (!postActive || !header || !postNeedsInjection()) return;
    const path = window.location.pathname;
    if (!document.querySelector('.post__actions')) header.appendChild(el('div', { className: 'post__actions' }));

    await createAndInsertPostPageButtons(header);
    const actions = document.querySelector<HTMLElement>('.kdl-actions-container');
    if (actions) actions.dataset.kdlPath = path;
    const { service, userID, postID } = getPostDetailsFromPage();
    fetchAndCachePostData(service, userID, postID).catch((error) => debugLog('Post data prefetch failed:', error));
  }
);

export const downloaderPostModule: KdlModule = {
  id: 'downloader.post',
  name: 'Post download buttons',
  description: 'Download, ZIP, pick-files and copy-links buttons on post pages.',
  group: 'Downloader',
  pages: ['post'],
  defaultEnabled: true,
  after: ['kui.post'],
  setup: installRestoreGuard,
  mount() {
    postActive = true;
    injectPost();
  },
  update: () => injectPost(),
  unmount() {
    postActive = false;
    document.querySelectorAll(POST_NODES).forEach((node) => node.remove());
    appState.cachedPostFiles = null;
  },
  beforeSnapshot() {
    document.querySelectorAll(POST_NODES).forEach((node) => node.remove());
  }
};

// ---- downloader.creator ----

let creatorActive = false;
const ctrlClickHandlers = new WeakMap<HTMLElement, (event: MouseEvent) => void>();

function creatorNeedsInjection(): boolean {
  const headerActions = document.querySelector('.user-header__actions');
  return (
    !!document.querySelector(USER_POST_CARDS + UNPROCESSED) ||
    (!!document.querySelector('.card-list') && !document.getElementById('kdl-bulk-panel')) ||
    (!!headerActions && !headerActions.querySelector('#kdl-author-manager-btn'))
  );
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

  if (!ctrlClickHandlers.has(card)) {
    const onClick = (event: MouseEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      (card.querySelector('.kdl-post-checkbox') as HTMLElement | null)?.click();
    };
    ctrlClickHandlers.set(card, onClick);
    card.dataset.kdlCtrlClickBound = 'true';
    card.addEventListener('click', onClick);
  }
}

const injectCreator = serialRunner(
  () => creatorActive,
  async () => {
    if (!creatorNeedsInjection()) {
      initializeShiftClickLogic();
      return;
    }
    await getSettings();
    if (!creatorActive) return;

    const userHeaderActions = document.querySelector('.user-header__actions');
    if (userHeaderActions && !userHeaderActions.querySelector('#kdl-author-manager-btn')) {
      userHeaderActions.prepend(createAuthorManagerButton());
    }

    createBulkDownloadPanel();
    const pageAuthorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';
    document.querySelectorAll<HTMLElement>(USER_POST_CARDS + UNPROCESSED).forEach((card) => injectUserPostCard(card, pageAuthorName));
    initializeShiftClickLogic();
  }
);

// `snapshot`: the cards are going away (or came back from a snapshot), so the shift-click markers go too.
// On a live disable they stay: those listeners belong to bulkPanel and do nothing without a checkbox
function stripCreatorInjections(snapshot: boolean): void {
  document.querySelectorAll(CREATOR_NODES).forEach((node) => node.remove());
  clearMarkers(USER_POST_CARDS);
  document.querySelectorAll<HTMLElement>('[data-kdl-ctrl-click-bound]').forEach((card) => {
    const handler = ctrlClickHandlers.get(card);
    if (handler) card.removeEventListener('click', handler);
    ctrlClickHandlers.delete(card);
    delete card.dataset.kdlCtrlClickBound;
  });
  if (snapshot) {
    document.querySelectorAll<HTMLElement>('[data-kdl-shift-click-bound]').forEach((node) => delete node.dataset.kdlShiftClickBound);
  }
}

export const downloaderCreatorModule: KdlModule = {
  id: 'downloader.creator',
  name: 'Creator bulk download',
  description: 'Per-card download buttons, selection checkboxes, bulk panel and author manager on creator pages.',
  group: 'Downloader',
  pages: ['creator'],
  defaultEnabled: true,
  setup: installRestoreGuard,
  mount() {
    creatorActive = true;
    injectCreator();
  },
  update: () => injectCreator(),
  // Unmount only happens on a new pathname (another creator or tab) or a disable: selection ends with it
  unmount() {
    creatorActive = false;
    stripCreatorInjections(false);
    appState.selectedPostIds.clear();
    document.getElementById('kdl-bulk-panel')?.remove();
  },
  beforeSnapshot: () => stripCreatorInjections(true)
};

// ---- favorites.quick ----

let favoritesActive = false;
let favoritesLoad: Promise<boolean> | null = null;

// One favorites request per page load: a failed (e.g. 401) fetch is not retried and does not re-toast
function loadFavoritesOnce(): Promise<boolean> {
  if (!favoritesLoad) favoritesLoad = getApiAdapter().fetchUserFavorites().catch(() => false);
  return favoritesLoad;
}

const injectFavorites = serialRunner(
  () => favoritesActive,
  async () => {
    if (!document.querySelector(`${ARTIST_CARDS}${UNPROCESSED}, ${LIST_POST_CARDS}${UNPROCESSED}`)) return;
    await getSettings();
    await loadFavoritesOnce();
    if (!favoritesActive) return;
    document.querySelectorAll<HTMLElement>(ARTIST_CARDS + UNPROCESSED).forEach((card) => {
      card.setAttribute(PROCESSED_ATTR, 'true');
      injectArtistFavoriteButton(card);
    });
    document.querySelectorAll<HTMLElement>(LIST_POST_CARDS + UNPROCESSED).forEach((card) => {
      card.setAttribute(PROCESSED_ATTR, 'true');
      injectPostFavoriteButton(card);
    });
  }
);

function stripFavoriteInjections(): void {
  document.querySelectorAll(FAVORITE_NODES).forEach((node) => node.remove());
  clearMarkers(`${ARTIST_CARDS}, ${LIST_POST_CARDS}`);
}

export const favoritesQuickModule: KdlModule = {
  id: 'favorites.quick',
  name: 'Quick favourites',
  description: 'A star button on artist and post cards in lists to favourite without opening them.',
  group: 'Lists',
  pages: ['list', 'search', 'artists'],
  defaultEnabled: true,
  setup: installRestoreGuard,
  mount() {
    favoritesActive = true;
    injectFavorites();
  },
  update: () => injectFavorites(),
  unmount() {
    favoritesActive = false;
    stripFavoriteInjections();
  },
  beforeSnapshot: stripFavoriteInjections
};

function stripAllInjections(snapshot: boolean): void {
  document.querySelectorAll(POST_NODES).forEach((node) => node.remove());
  stripCreatorInjections(snapshot);
  stripFavoriteInjections();
}
