import { PageInfo } from './types';
import { detectPage, detectSite, keepOwnHeadNodes, pageFromDom, pageFromUrl, resolveRoot, writePageAttributes } from './page';
import { attachRuntime, snapshotMounted, syncModules, unmountPageScoped, updateMounted } from './registry';

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

function reconcile(): void {
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
    return;
  }
  // Same path (query change, partial swap, history restore of the same page): re-detect, keep what still matches
  const page = detectPage();
  if (page.type !== current.type) setPage(page);
  syncModules();
  updateMounted();
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
function writeEarlyPageAttributes(event: Event): void {
  const target = (event as CustomEvent).detail?.target as Element | undefined;
  // An outerHTML swap leaves the event on the old, now detached #main
  const replacedMain = !!target && !target.isConnected && target.matches('#main, main');
  if (!replacedMain && !swapReplacesPage(event)) return;
  const path = htmxNextPath(event) || window.location.pathname;
  const fromUrl = pageFromUrl(path);
  writePageAttributes({ type: fromUrl === 'other' ? pageFromDom() : fromUrl, site: detectSite(), path });
}

function installNavigationHooks(): void {
  document.addEventListener('htmx:beforeHistorySave', () => snapshotMounted());
  // Capture on window runs before the site's own beforeSwap listener on document (see keepOwnHeadNodes)
  window.addEventListener('htmx:beforeSwap', keepOwnHeadNodes, true);
  document.addEventListener('htmx:beforeSwap', (event) => {
    if (swapReplacesPage(event)) leaveIfPathChanges(htmxNextPath(event));
  });
  document.addEventListener('htmx:afterSwap', (event) => {
    writeEarlyPageAttributes(event);
    scheduleReconcile();
  });
  document.addEventListener('htmx:afterSettle', () => scheduleReconcile());
  document.addEventListener('htmx:historyRestore', () => scheduleReconcile());
  window.addEventListener('popstate', () => {
    if (window.location.pathname !== lastPath) unmountPageScoped();
    scheduleReconcile();
  });

  // Query/hash-only updates keep the current page (and a playing video) alive
  const wrap = (original: History['pushState']): History['pushState'] =>
    function (this: History, ...args: Parameters<History['pushState']>) {
      const next = pathOf(args[2]);
      if (next !== null) leaveIfPathChanges(next);
      original.apply(this, args);
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
