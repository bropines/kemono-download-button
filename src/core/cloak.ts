// Page cloak: while the redesign is on, the page content (#main) stays invisible from document start (and
// from each htmx page swap) until the modules have mounted on it, so the site's own layout never flashes
// before ours. Modules whose blocks come from the API may hold the cloak for a short while with their
// request (similar creators, the creator overview): cached data then lands in the very first frame, and a
// slow network only delays the reveal by HOLD_MS before the page shows without them. The document-start
// cloak is only put up while there is no <body> yet: a userscript manager that injects late must not hide a
// page that is already on screen.
//
// Only #main is hidden: the header and sidebar are pure CSS and already right. A failsafe always reveals.

import { keepInHead } from './page';
import { skeletonBaseCss, snapshotCss } from './skeleton';
import { snapshotFor } from './skeletonStore';
import type { SkeletonSnapshot } from './skeletonCapture';

const ATTR = 'data-kdl-cloak';
// Set once the first page is reworked (and kept): the optional preload userstyle (extras/kdl-preload.user.css),
// which a style manager applies before the userscript manager injects us, hides #main until it appears
const READY = 'data-kdl-ready';
const STYLE_ID = 'kdl-cloak-style';
const FAILSAFE_MS = 2500;
// Asked again this often while the guard (setCloakFailsafeGuard) says the page is not ready to be shown
const FAILSAFE_RETRY_MS = 400;
const HOLD_MS = 150;
// Revealed by then even if frames do not come (a throttled frame, a long task)
const REVEAL_MAX_MS = 300;
// A loading skeleton stands in for the hidden content: a snapshot of the page coming in (src/core/skeletonStore.ts)
// It stays drawn while the page animates in (data-kdl-enter, set by the page transitions module), which fades it out
// Only where <html data-kdl-skeleton> says so: at once on a first load, but a page htmx swapped in is hidden for a
// few frames only, and its skeleton would be a flash between the old page and the new one. There it is drawn
// when the wait gets long (blocks held for their data, a slow device).
const SKELETON = 'data-kdl-skeleton';
const SKELETON_AFTER_MS = 140;
const ON = `html[${SKELETON}]:is([${ATTR}], [data-kdl-enter]) #main`;
// The children, not #main itself: a descendant with its own visibility: visible showed through a hidden #main.
// The skeleton lives on #main's pseudo-elements, which `> *` does not reach.
// <html data-kdl-tail>: a page of the same creator came in under the header and tabs row, which stayed on screen
// (src/core/creatorSwap.ts). Only what is under them is hidden, and the skeleton is cut off above the tabs row's
// bottom edge (--kdl-sk-cut, in the skeleton's own coordinates) and moved by --kdl-sk-shift, so its content
// lines up under the live tabs row when the snapshot's header was taller or shorter (see measureTail).
const TAIL = 'data-kdl-tail';
const HIDDEN = '{ opacity: 0 !important; pointer-events: none !important; }';
const HIDE = `html[${ATTR}]:not([${TAIL}]) #main > *, html[${ATTR}]:not([${TAIL}]) main > * ${HIDDEN}
html[${ATTR}][${TAIL}] #main > :not(.site-section--user), html[${ATTR}][${TAIL}] #main > .site-section--user > :not(.user-header, .kdl-sk-tabs-row) ${HIDDEN}`;
const ON_TAIL = `html[${SKELETON}][${TAIL}]:is([${ATTR}], [data-kdl-enter]) #main`;
function tailCss(snap: { grid?: { y: number } }): string {
  const moved = 'transform: translate3d(0, var(--kdl-sk-shift, 0px), 0);';
  const gridTop = snap.grid ? Math.round(snap.grid.y) : 0;
  return `${ON_TAIL}::before { ${moved} clip-path: inset(max(0px, var(--kdl-sk-cut, 0px)) 0 0 0); }
${ON_TAIL}::after { ${moved} clip-path: inset(max(0px, calc(var(--kdl-sk-cut, 0px) - ${gridTop}px)) 0 0 0); }`;
}
// While the page animates in (page transitions), the skeleton dissolves under it; with reduced motion, or
// without the transitions' styles, it goes at once: never drawn over a page that is already shown
const LEAVING = `html[${SKELETON}][data-kdl-enter]:not([${ATTR}]) #main`;
const BASE = `${skeletonBaseCss(ON)}
${LEAVING}::before, ${LEAVING}::after { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  ${LEAVING}::before, ${LEAVING}::after { animation: kdl-skeleton-out 260ms ease-out; }
  @keyframes kdl-skeleton-out { from { opacity: 1; } to { opacity: 0; } }
}`;

// One stylesheet per snapshot: a skeleton is ~100 KB of SVG in a data: URL, built once and not on every navigation
// (snapshotFor hands out the same object until a newer snapshot is stored)
const cssBySnapshot = new WeakMap<object, string>();
const NO_SKELETON = [HIDE, BASE].join('\n');

// The snapshot the skeleton on screen is drawn from (measureTail lines it up)
let shownSnap: SkeletonSnapshot | null = null;

function cloakCss(path: string, builtinOnly: boolean): string {
  shownSnap = null;
  try {
    const snap = snapshotFor(path, builtinOnly);
    if (!snap) return NO_SKELETON;
    shownSnap = snap;
    let css = cssBySnapshot.get(snap);
    if (css === undefined) {
      css = [HIDE, BASE, snapshotCss(ON, snap, `html[${ATTR}] #main`), tailCss(snap)].join('\n');
      cssBySnapshot.set(snap, css);
    }
    return css;
  } catch {
    // A stored snapshot this build cannot draw: hide without a skeleton (capture replaces it later)
    return NO_SKELETON;
  }
}

let failsafe: ReturnType<typeof setTimeout> | undefined;
let skeletonTimer: ReturnType<typeof setTimeout> | undefined;
let shownCss = '';
let failsafeGuard: (() => boolean) | null = null;

/** Asked when the failsafe is due: true keeps the page hidden a little longer (and it is asked again). For the
    first load, where "2.5 s passed" may only mean the document is still coming in (src/index.ts). */
export function setCloakFailsafeGuard(guard: (() => boolean) | null): void {
  failsafeGuard = guard;
}

function armFailsafe(delay: number): void {
  clearTimeout(failsafe);
  failsafe = setTimeout(() => {
    let wait = false;
    try {
      wait = !!failsafeGuard?.();
    } catch {
      // The guard is ours (index.ts); should it break, the page is shown
    }
    if (wait && isCloaked()) armFailsafe(FAILSAFE_RETRY_MS);
    else uncloak();
  }, delay);
}
const cloakListeners = new Set<() => void>();
const revealListeners = new Set<() => void>();
const beforeRevealListeners = new Set<() => void>();
const notify = (listeners: Set<() => void>): void =>
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // A listener is decoration (page transitions): the cloak itself must go on
    }
  });

/** Called whenever a page is hidden behind its skeleton */
export function onCloak(fn: () => void): void {
  cloakListeners.add(fn);
}

/** Called one frame before a hidden page is shown, the modules mounted on it: the place to read styles the
    reveal depends on. The page's style is being worked out in that frame anyway; reading it at the reveal itself
    put a forced style pass between the attribute changes of the reveal, each restyling the whole page. */
export function onBeforeReveal(fn: () => void): void {
  beforeRevealListeners.add(fn);
}

/** Called right as a hidden page is shown (not when it was never hidden) */
export function onReveal(fn: () => void): void {
  revealListeners.add(fn);
}
let holds: Promise<unknown>[] = [];
let generation = 0;

export function isCloaked(): boolean {
  return document.documentElement.hasAttribute(ATTR);
}

/** Hides the page content until reveal() (or the failsafe), showing the skeleton of the page at `path`.
    `builtinOnly`: the first load under the preload userstyle, whose skeleton (a built-in one) is on screen.
    `skeleton`: drawn at once ('now', a first load) or only if the page stays hidden for a while ('late').
    `tail`: only the part under a creator's header and tabs row is hidden (src/core/creatorSwap.ts) */
export function cloak(path = window.location.pathname, builtinOnly = false, skeleton: 'now' | 'late' = 'now', tail = false): void {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = keepInHead(document.createElement('style'));
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }
  const css = cloakCss(path, builtinOnly);
  // Compared with what was last written, not with the sheet's text: reading 100 KB back on every navigation
  if (css !== shownCss || !style.firstChild) {
    style.textContent = css;
    shownCss = css;
  }
  generation++;
  holds = [];
  const root = document.documentElement;
  clearTimeout(skeletonTimer);
  if (skeleton === 'now') root.setAttribute(SKELETON, '');
  else {
    root.removeAttribute(SKELETON);
    skeletonTimer = setTimeout(() => {
      if (!isCloaked()) return;
      // Measured now, not at the swap: the header may have grown since (a row of counts from a cached request)
      if (tail) measureTail();
      root.setAttribute(SKELETON, '');
    }, SKELETON_AFTER_MS);
  }
  setTail(tail);
  root.setAttribute(ATTR, '');
  notify(cloakListeners);
  armFailsafe(FAILSAFE_MS);
}

/** Whether the coming or current page change keeps the creator header and tabs row (see TAIL above). Set by the
    cloak, and by the page transitions as the current page starts leaving. */
export function setTail(on: boolean): void {
  const html = document.documentElement;
  if (on) html.setAttribute(TAIL, '');
  else html.removeAttribute(TAIL);
}

/** Where the skeleton of a same-creator section swap is cut and how far it moves (see TAIL), as it is drawn */
function measureTail(): void {
  const html = document.documentElement;
  const main = document.querySelector('#main');
  const row = main?.querySelector(':scope > .site-section--user > .kdl-sk-tabs-row');
  if (!html.hasAttribute(TAIL) || !main || !row) return;
  // In the skeleton's coordinates: from the top of #main's content box as the snapshot had it
  const live = row.getBoundingClientRect().bottom - main.getBoundingClientRect().top - main.clientTop - (shownSnap?.pad[0] ?? 0);
  const own = shownSnap?.cut;
  const shift = typeof own === 'number' ? live - own : 0;
  html.style.setProperty('--kdl-sk-cut', `${Math.round(live - shift)}px`);
  html.style.setProperty('--kdl-sk-shift', `${Math.round(shift)}px`);
}

function markReady(): void {
  document.documentElement.setAttribute(READY, '');
}

function uncloak(): void {
  clearTimeout(failsafe);
  clearTimeout(skeletonTimer);
  holds = [];
  const was = isCloaked();
  document.documentElement.removeAttribute(ATTR);
  markReady();
  if (was) notify(revealListeners);
}

/** While cloaked, keep the page hidden until this settles (at most HOLD_MS after the reveal is asked for) */
export function holdCloak(task: Promise<unknown>): void {
  if (isCloaked()) holds.push(task.catch(() => undefined));
}

/** Reveals right before the next paint, once the holds settled or HOLD_MS passed. No-op when not cloaked. */
export function reveal(): void {
  if (!isCloaked()) return markReady();
  const current = ++generation;
  const pending = holds;
  const show = (): void => {
    if (current !== generation) return;
    let done = false;
    const run = (): void => {
      if (done || current !== generation) return;
      done = true;
      uncloak();
    };
    // Two frames: the first lays out and paints the reworked page still under the skeleton (rows with
    // content-visibility, observers that fire on it); what that sets off runs before the second, so the page
    // is revealed ready to draw instead of mid-work (the skeleton, animated off the main thread, keeps
    // shimmering meanwhile). rAF never fires in background tabs: a timer stands in there.
    requestAnimationFrame(() => {
      if (!done && current === generation) notify(beforeRevealListeners);
      requestAnimationFrame(run);
    });
    setTimeout(run, document.hidden ? 0 : REVEAL_MAX_MS);
  };
  if (!pending.length) return show();
  let timer: ReturnType<typeof setTimeout> | undefined;
  void Promise.race([
    Promise.all(pending),
    new Promise<void>((resolve) => { timer = setTimeout(resolve, HOLD_MS); }),
  ]).then(() => {
    clearTimeout(timer);
    // Let the modules that awaited the same promises render first
    setTimeout(show, 0);
  });
}
