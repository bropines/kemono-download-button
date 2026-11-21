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
const capturable = (route: string): boolean => KNOWN.has(route) || route.startsWith('creator-');

/** The best snapshot for a path at the current screen class. `builtinOnly`: the one the preload userstyle
    draws (generated from the same built-in snapshots), so taking over from it changes nothing on screen */
export function snapshotFor(path = window.location.pathname, builtinOnly = false): SkeletonSnapshot | null {
  const route = skeletonRoute(path);
  const bucket = skeletonBucket();
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
  const path = window.location.pathname;
  if (!capturable(skeletonRoute(path))) return;
  timer = setTimeout(() => {
    const run = (): void => {
      // Navigated away, or a cloak is up again: this page is not what is on screen
      if (window.location.pathname !== path || document.documentElement.hasAttribute('data-kdl-cloak')) return;
      try {
        const snap = captureSkeleton();
        if (!snap || !snap.shapes.length) return;
        const key = storeKey(skeletonRoute(path), skeletonBucket());
        const json = JSON.stringify(snap);
        if (JSON.stringify(readStored<unknown>(key, null)) !== json) writeStored(key, snap);
      } catch {
        // A skeleton is a nicety: never let it disturb the page
      }
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
    else run();
  }, SETTLE_MS);
}
