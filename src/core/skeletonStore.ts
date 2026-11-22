// Which skeleton a page gets, and keeping the user's own up to date.
//
// Lookup for a route and screen class: the user's own snapshot (taken in this browser, so it has their grid
// size, page width, theme and phone layout), then the built-in one (src/core/skeletons.json), then the
// nearest kind of page (a creator tab falls back to the creator page, anything else to the post list).
//
// After every page has settled (revealed, then idle), the redesign takes a fresh snapshot of it and keeps it
// in the userscript manager's storage when it changed: the next visit to that kind of page is loaded behind
// a picture of exactly how it will look.

import { readStored, writeStored } from '../state/gmStorage';
import { captureSkeleton, skeletonBucket, skeletonRoute, type SkeletonSnapshot } from './skeletonCapture';
import builtin from './skeletons.json';

const KEY = 'skeleton';
const BUILTIN = builtin as unknown as Record<string, SkeletonSnapshot>;
// Let similar creators, the overview and the gallery land before taking the picture
const SETTLE_MS = 2500;

const storeKey = (route: string, bucket: string): string => `${KEY}.${route}.${bucket}`;

const isLin = (value: unknown): boolean => Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number');
const validShapes = (shapes: unknown): boolean =>
  Array.isArray(shapes) && shapes.every((s) => !!s && isLin(s.x) && isLin(s.w) && typeof s.y === 'number' && typeof s.h === 'number');

function valid(snap: unknown): snap is SkeletonSnapshot {
  if (!snap || typeof snap !== 'object') return false;
  const { v, pad, shapes, grid } = snap as SkeletonSnapshot;
  if (v !== 1 || !Array.isArray(pad) || !validShapes(shapes)) return false;
  return !grid || (isLin(grid.x) && isLin(grid.w) && typeof grid.tw === 'number' && typeof grid.th === 'number' && validShapes(grid.shapes));
}

// Only kinds of pages the site has: a path with an id in it (a share link, a mistyped URL) would leave a stored
// snapshot behind per address, never read again
const KNOWN = new Set(Object.keys(BUILTIN).map((key) => key.split('|')[0]));
// Creator tabs the site has; any other fourth path segment is a typo or an old link
const CREATOR_TABS = new Set(['links', 'recommended', 'announcements', 'fancards', 'tags', 'dms', 'shares', 'community'].map((tab) => `creator-${tab}`));
const capturable = (route: string): boolean => KNOWN.has(route) || CREATOR_TABS.has(route);

// Back/forward changes the URL before the page is swapped in: until a swap follows, what is on screen is still
// the previous page and must not be stored as this one's snapshot
let routeChangedAt = 0;
let swappedAt = 0;
let tracking = false;
function trackSwaps(): void {
  if (tracking) return;
  tracking = true;
  window.addEventListener('popstate', () => { routeChangedAt = Date.now(); });
  ['htmx:afterSwap', 'htmx:historyRestore'].forEach((type) => document.addEventListener(type, () => { swappedAt = Date.now(); }));
}

/** Rough shape of a snapshot: small reflows (a wrapped line more or less) do not rewrite the stored one */
const signature = (snap: SkeletonSnapshot): string =>
  `${Math.round(snap.shapes.length / 8)}|${snap.grid ? Math.round(snap.grid.shapes.length / 4) : '-'}`;

/** The best snapshot for a path at the current screen class. `builtinOnly`: the one the preload userstyle
    draws (generated from the same built-in snapshots), so taking over from it changes nothing on screen */
export function snapshotFor(path = window.location.pathname, builtinOnly = false): SkeletonSnapshot | null {
  const route = skeletonRoute(path);
  const bucket = skeletonBucket();
  // Looked up once per kind of page: reading (and parsing) the stored snapshot again on every navigation gave a
  // new object each time, so nothing built from it could be kept. A snapshot stored by this tab drops the memo;
  // one stored by another tab is picked up on the next load.
  const memoKey = `${route}|${bucket}|${builtinOnly ? 1 : 0}`;
  const known = lookups.get(memoKey);
  if (known !== undefined) return known;
  const found = lookUp(route, bucket, builtinOnly);
  lookups.set(memoKey, found);
  return found;
}

const lookups = new Map<string, SkeletonSnapshot | null>();

function lookUp(route: string, bucket: string, builtinOnly: boolean): SkeletonSnapshot | null {
  const candidates = [route, route.startsWith('creator-') ? 'creator' : '', 'posts'].filter(Boolean);
  for (const name of candidates) {
    const own = builtinOnly ? null : readStored<unknown>(storeKey(name, bucket), null);
    if (valid(own)) return own;
    const shipped = BUILTIN[`${name}|${bucket}`];
    if (valid(shipped)) return shipped;
  }
  return null;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** After a page is shown: once it settles, keep a snapshot of it when it differs from the stored one */
export function scheduleSkeletonCapture(): void {
  clearTimeout(timer);
  trackSwaps();
  const path = window.location.pathname;
  if (!capturable(skeletonRoute(path))) return;
  timer = setTimeout(() => {
    const run = (): void => {
      // Navigated away, or a cloak is up again: this page is not what is on screen
      if (window.location.pathname !== path || document.documentElement.hasAttribute('data-kdl-cloak')) return;
      if (routeChangedAt > swappedAt) return;
      try {
        const snap = captureSkeleton();
        if (!snap || !snap.shapes.length) return;
        const key = storeKey(skeletonRoute(path), skeletonBucket());
        const stored = readStored<unknown>(key, null);
        if (!valid(stored) || signature(stored) !== signature(snap)) {
          writeStored(key, snap);
          lookups.clear();
        }
      } catch {
        // A skeleton is a nicety: never let it disturb the page
      }
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
    else run();
  }, SETTLE_MS);
}
