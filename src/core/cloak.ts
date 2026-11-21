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

const ATTR = 'data-kdl-cloak';
// Set once the first page is reworked (and kept): the optional preload userstyle (extras/kdl-preload.user.css),
// which a style manager applies before the userscript manager injects us, hides #main until it appears
const READY = 'data-kdl-ready';
const STYLE_ID = 'kdl-cloak-style';
const FAILSAFE_MS = 2500;
const HOLD_MS = 150;
// Revealed by then even if frames do not come (a throttled frame, a long task)
const REVEAL_MAX_MS = 300;
// A loading skeleton stands in for the hidden content: a snapshot of the page coming in (src/core/skeletonStore.ts)
// It stays drawn while the page animates in (data-kdl-enter, set by the page transitions module), which fades it out
const ON = `html:is([${ATTR}], [data-kdl-enter]) #main`;
// The children, not #main itself: a descendant with its own visibility: visible showed through a hidden #main.
// The skeleton lives on #main's pseudo-elements, which `> *` does not reach.
const HIDE = `html[${ATTR}] #main > *, html[${ATTR}] main > * { opacity: 0 !important; pointer-events: none !important; }`;
// While the page animates in (page transitions), the skeleton dissolves under it; with reduced motion, or
// without the transitions' styles, it goes at once: never drawn over a page that is already shown
const LEAVING = `html[data-kdl-enter]:not([${ATTR}]) #main`;
const BASE = `${skeletonBaseCss(ON)}
${LEAVING}::before, ${LEAVING}::after { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  ${LEAVING}::before, ${LEAVING}::after { animation: kdl-skeleton-out 260ms ease-out; }
  @keyframes kdl-skeleton-out { from { opacity: 1; } to { opacity: 0; } }
}`;

function cloakCss(path: string, builtinOnly: boolean): string {
  let skeleton = '';
  try {
    const snap = snapshotFor(path, builtinOnly);
    if (snap) skeleton = snapshotCss(ON, snap, `html[${ATTR}] #main`);
  } catch {
    // A stored snapshot this build cannot draw: hide without a skeleton (capture replaces it later)
  }
  return [HIDE, BASE, skeleton].join('\n');
}

let failsafe: ReturnType<typeof setTimeout> | undefined;
const cloakListeners = new Set<() => void>();
const revealListeners = new Set<() => void>();
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
    `builtinOnly`: the first load under the preload userstyle, whose skeleton (a built-in one) is on screen */
export function cloak(path = window.location.pathname, builtinOnly = false): void {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = keepInHead(document.createElement('style'));
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }
  const css = cloakCss(path, builtinOnly);
  if (style.textContent !== css) style.textContent = css;
  generation++;
  holds = [];
  document.documentElement.setAttribute(ATTR, '');
  notify(cloakListeners);
  clearTimeout(failsafe);
  failsafe = setTimeout(uncloak, FAILSAFE_MS);
}

function markReady(): void {
  document.documentElement.setAttribute(READY, '');
}

function uncloak(): void {
  clearTimeout(failsafe);
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
    requestAnimationFrame(() => requestAnimationFrame(run));
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
