import { PageInfo } from './types';
import { detectPage, detectSite, keepOwnHeadNodes, pageFromDom, pageFromUrl, resolveRoot, writePageAttributes } from './page';
import { attachRuntime, bootEarlyFor, isModuleEnabled, snapshotMounted, syncModules, unmountPageScoped, updateMounted } from './registry';
import { cloak, onReveal, reveal } from './cloak';
import { scheduleSkeletonCapture } from './skeletonStore';
import { installLinkBoost } from './boostLinks';

let current: PageInfo;
let root: Element;
let lastPath: string | null = null;
let started = false;
const pageChangeListeners = new Set<(page: PageInfo) => void>();

/** Called after every pathname change, once the new page is detected (before modules mount) */
export function onPageChange(fn: (page: PageInfo) => void): () => void {
  pageChangeListeners.add(fn);
  return () => pageChangeListeners.delete(fn);
}

export function getCurrentPage(): PageInfo {
  return current || detectPage();
}

function refreshRoot(): void {
  if (!root || !root.isConnected || root === document.body) root = resolveRoot();
}

function setPage(page: PageInfo): void {
  current = page;
  writePageAttributes(page);
}

// ---- Navigation ----

// ---- Back/forward ----

// Where htmx put the scroll of the page it restored from its history cache. It scrolls there itself, but right
// after the swap: before the modules have reworked the page (blocks added above, the tag list still short), so
// the position is put right again once they have, and once more as the page is shown.
let restoreScroll: number | null = null;
let restoreTimer: ReturnType<typeof setTimeout> | undefined;

/** The scroll position a history restore is going back to, while that restore is being set up (else null) */
export function getRestoreScroll(): number | null {
  return restoreScroll;
}

function applyRestoreScroll(): void {
  if (restoreScroll === null) return;
  if (Math.abs(window.scrollY - restoreScroll) > 1) window.scrollTo(0, restoreScroll);
}

function endRestoreScroll(): void {
  applyRestoreScroll();
  clearTimeout(restoreTimer);
  restoreScroll = null;
}

// Back/forward to a page htmx no longer has cached: it asks the server, and the old page stays in the DOM under
// the new address until the answer is swapped in. Nothing is mounted on it meanwhile.
let awaitingHistory = false;
let historyTimer: ReturnType<typeof setTimeout> | undefined;
const HISTORY_LOAD_MAX_MS = 10000;

function historyLoadDone(): void {
  awaitingHistory = false;
  clearTimeout(historyTimer);
}

function reconcile(): void {
  if (awaitingHistory) return;
  refreshRoot();
  const path = window.location.pathname;
  if (path !== lastPath) {
    unmountPageScoped();
    lastPath = path;
    setPage(detectPage());
    pageChangeListeners.forEach((fn) => {
      try {
        fn(current);
      } catch (error) {
        console.error('[KDL] page change listener failed:', error);
      }
    });
    syncModules();
    // Modules mounted for 'any' page stay mounted across the navigation: they still need to see the new page now,
    // not on the next unrelated mutation
    updateMounted();
    applyRestoreScroll();
    revealPage();
    return;
  }
  // Same path (query change, partial swap, history restore of the same page): re-detect, keep what still matches
  const page = detectPage();
  if (page.type !== current.type) setPage(page);
  syncModules();
  updateMounted();
  applyRestoreScroll();
  // Not a new page: no new snapshot (an open panel or a typed filter is not how the page loads)
  reveal();
}

// The new page content is in the DOM but not painted yet: keep it hidden until the modules reworked it
// (its skeleton only if that takes long: the page is in the DOM already, a few frames from being shown)
function cloakNewPage(path: string | null = null): void {
  if (isModuleEnabled('ui.shadcn')) cloak(path || window.location.pathname, false, 'late');
}

// Shown: a fresh snapshot of it for the next visit's skeleton (with the redesign only)
function revealPage(): void {
  reveal();
  if (isModuleEnabled('ui.shadcn')) scheduleSkeletonCapture();
}

let navTimer: ReturnType<typeof setTimeout> | null = null;

// One htmx navigation fires beforeSwap, afterSwap, afterSettle and pushState: coalesce them into one pass
function scheduleReconcile(delay = 50): void {
  if (navTimer) clearTimeout(navTimer);
  navTimer = setTimeout(() => {
    navTimer = null;
    reconcile();
  }, delay);
}

// Unmount before the old DOM goes away, so modules can restore it (video player, gallery) while it still exists
function leaveIfPathChanges(nextPath: string | null): void {
  if (nextPath === null || nextPath !== window.location.pathname) unmountPageScoped();
}

// The address changed and the page for it is not set up yet: let its modules get ready (registry.bootEarlyFor)
function prepareNextPage(): void {
  const path = window.location.pathname;
  if (path === lastPath) return;
  const type = pageFromUrl(path);
  if (type !== 'other') bootEarlyFor({ type, site: detectSite(), path });
}

function pathOf(url: string | URL | null | undefined): string | null {
  if (url == null) return null;
  try {
    return new URL(String(url), window.location.href).pathname;
  } catch {
    return null;
  }
}

// htmx 1.x/2.x put the destination in pathInfo; fall back to the xhr. Unknown means "assume a new page"
function htmxNextPath(event: Event): string | null {
  const detail = (event as CustomEvent).detail || {};
  return (
    pathOf(detail.pathInfo?.responsePath) ||
    pathOf(detail.pathInfo?.finalRequestPath) ||
    pathOf(detail.pathInfo?.requestPath) ||
    pathOf(detail.xhr?.responseURL) ||
    null
  );
}

// A swap replaces the page only when its target holds our root; favourite/comment/pagination partials do not
function swapReplacesPage(event: Event): boolean {
  const target = (event as CustomEvent).detail?.target as Element | undefined;
  refreshRoot();
  return !target || target === root || target.contains(root);
}

// The new #main is in the DOM but not painted yet: point <html data-kdl-page> at it now, so page-scoped
// rules (restyle themes) match on the first frame instead of after the coalesced reconcile
function writeEarlyPageAttributes(event: Event): boolean {
  const target = (event as CustomEvent).detail?.target as Element | undefined;
  // An outerHTML swap leaves the event on the old, now detached #main
  const replacedMain = !!target && !target.isConnected && target.matches('#main, main');
  if (!replacedMain && !swapReplacesPage(event)) return false;
  const path = htmxNextPath(event) || window.location.pathname;
  const fromUrl = pageFromUrl(path);
  writePageAttributes({ type: fromUrl === 'other' ? pageFromDom() : fromUrl, site: detectSite(), path });
  return true;
}

function installNavigationHooks(): void {
  installLinkBoost();
  document.addEventListener('htmx:beforeHistorySave', () => snapshotMounted());
  // Capture on window runs before the site's own beforeSwap listener on document (see keepOwnHeadNodes)
  window.addEventListener('htmx:beforeSwap', keepOwnHeadNodes, true);
  document.addEventListener('htmx:beforeSwap', (event) => {
    if (swapReplacesPage(event)) leaveIfPathChanges(htmxNextPath(event));
  });
  document.addEventListener('htmx:afterSwap', (event) => {
    if (writeEarlyPageAttributes(event)) {
      // A new page starts at the top (a history restore names its position after this, in htmx:historyRestore)
      restoreScroll = null;
      cloakNewPage(htmxNextPath(event));
    }
    scheduleReconcile();
  });
  // The last event of a swap: the page is final, nothing more to wait for (the 50 ms above only gather the
  // events of one navigation; every one of them is spent with the new page hidden)
  document.addEventListener('htmx:afterSettle', () => scheduleReconcile(0));
  document.addEventListener('htmx:historyCacheMiss', () => {
    awaitingHistory = true;
    if (navTimer) clearTimeout(navTimer);
    navTimer = null;
    clearTimeout(historyTimer);
    // The answer never came (offline, an aborted request): set up whatever is on screen
    historyTimer = setTimeout(() => {
      historyLoadDone();
      scheduleReconcile(0);
    }, HISTORY_LOAD_MAX_MS);
  });
  for (const failed of ['htmx:historyCacheMissError', 'htmx:historyCacheMissLoadError']) {
    document.addEventListener(failed, () => {
      historyLoadDone();
      scheduleReconcile(0);
    });
  }
  document.addEventListener('htmx:historyRestore', (event) => {
    historyLoadDone();
    const scroll = Number((event as CustomEvent).detail?.item?.scroll);
    clearTimeout(restoreTimer);
    restoreScroll = Number.isFinite(scroll) && scroll > 0 ? scroll : null;
    // Without a cloak (the redesign off) nothing announces the reveal: forget the position soon anyway (and do
    // not go back to it then: the user may be scrolling already)
    if (restoreScroll !== null) restoreTimer = setTimeout(() => (restoreScroll = null), 1500);
    cloakNewPage();
    // htmx scrolls in a zero timeout it set just before this event: ours runs right after it
    scheduleReconcile(0);
  });
  onReveal(endRestoreScroll);
  window.addEventListener('popstate', () => {
    if (window.location.pathname !== lastPath) unmountPageScoped();
    prepareNextPage();
    scheduleReconcile();
  });

  // Query/hash-only updates keep the current page (and a playing video) alive
  const wrap = (original: History['pushState']): History['pushState'] =>
    function (this: History, ...args: Parameters<History['pushState']>) {
      const next = pathOf(args[2]);
      if (next !== null) leaveIfPathChanges(next);
      original.apply(this, args);
      prepareNextPage();
      scheduleReconcile();
    };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
}

// ---- Mutations ----

// A node is ours when its id or any class carries the kdl-/kui- prefix. For ancestors only a *leading*
// prefix counts: site elements get marker classes such as `kui-processed` appended after their own
const OWN_NODE = '[id^="kdl-"], [id^="kui-"], [class^="kdl-"], [class*=" kdl-"], [class^="kui-"], [class*=" kui-"]';
const OWN_ANCESTOR = '[id^="kdl-"], [id^="kui-"], [class^="kdl-"], [class^="kui-"]';

const isOwnNode = (node: Node): boolean => (node instanceof Element ? node.matches(OWN_NODE) : false);

function isOwnMutation(mutation: MutationRecord): boolean {
  const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
  if (target?.closest(OWN_ANCESTOR)) return true;
  const changed = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)];
  return changed.length > 0 && changed.every(isOwnNode);
}

// Content changes inside the root count; outside it only top-level ones (an htmx body swap, a replaced #main)
function isRelevant(mutation: MutationRecord): boolean {
  if (isOwnMutation(mutation)) return false;
  const target = mutation.target;
  if (!root.isConnected) return true;
  return root.contains(target) || target === document.body || target === document.documentElement;
}

const DEBOUNCE_MS = 120;
const MAX_WAIT_MS = 600;
let mutationTimer: ReturnType<typeof setTimeout> | null = null;
let firstPendingAt = 0;

// rAF never fires in a background tab: a timer stands in so tabs opened in the background still get set up
function nextFrame(fn: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 250);
}

function flushMutations(): void {
  nextFrame(() => {
    refreshRoot();
    if (window.location.pathname !== lastPath) {
      reconcile();
      return;
    }
    // URL said nothing and the page rendered late (kemono.cr SPA): the DOM may name the page now
    if (current.type === 'other') {
      const fromDom = pageFromDom();
      if (fromDom !== 'other') {
        setPage({ ...current, type: fromDom });
        syncModules();
      }
    }
    updateMounted();
  });
}

function onMutations(mutations: MutationRecord[]): void {
  if (!root || !mutations.some(isRelevant)) return;
  const now = Date.now();
  if (!mutationTimer) firstPendingAt = now;
  else clearTimeout(mutationTimer);
  const wait = now - firstPendingAt >= MAX_WAIT_MS ? 0 : DEBOUNCE_MS;
  mutationTimer = setTimeout(() => {
    mutationTimer = null;
    flushMutations();
  }, wait);
}

// ---- Start ----

/** Detect the page, mount matching modules, then follow navigations and mutations. Idempotent. */
export function startRouter(): void {
  if (started) return;
  started = true;
  root = resolveRoot();
  lastPath = window.location.pathname;
  setPage(detectPage());
  attachRuntime({ page: () => current, root: () => root });
  installNavigationHooks();
  pageChangeListeners.forEach((fn) => fn(current));
  syncModules();
  new MutationObserver(onMutations).observe(document.body, { childList: true, subtree: true });
}
