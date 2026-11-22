// Page transitions: navigating between pages (creator tabs, post list pages, into a post and back) animates.
// While the next page loads, the current one dims and leans towards where the next comes from; the loading
// skeleton then dissolves as the new page slides in from that side, its card grid cascading in.
//
// The direction comes from the navigation: the next/previous creator tab or list page slides sideways, going
// into a page (a creator's post) rises from below, going back drops in from above. Rides on the page cloak
// (src/core/cloak.ts): the enter animation plays when a hidden page is shown, so it only exists with the
// redesign, and never on a page the user already sees.
//
// Only opacity and transform are animated: those run on the compositor. A blur on the page's blocks (tried: 3px)
// keeps the animation on the main thread ("filter may move pixels"), which restyles and repaints the page every
// frame; so does a cascade over every card of a long list, which is why only the first rows take part.

import { isCloaked, onBeforeReveal, onCloak, onReveal } from '../../core/cloak';
import type { KdlModule } from '../../core/types';

const LEAVE = 'data-kdl-leave';
const ENTER = 'data-kdl-enter';
const STILL = 'data-kdl-still';
const FIXED = 'data-kdl-fixed';
const PART = 'data-kdl-part';
type Direction = 'next' | 'prev' | 'in' | 'out';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const ENTER_MS = 420;
const STAGGER_MS = 40;
const BLOCKS = 6;
// Only the cards of the first rows cascade: the animation of every card is re-styled on the main thread each
// frame (~5 ms a frame on a desktop for a page of 50), and the rest are below the fold or come in with the block
const CARDS = 12;
const CARD_MS = 520;
const CARD_DELAY_MS = 120;
const CARD_STAGGER_MS = 18;
// Long enough for the last staggered card; a hidden or slow page must not keep the attribute
const ENTER_TOTAL_MS = CARD_DELAY_MS + CARDS * CARD_STAGGER_MS + CARD_MS + 60;
const LEAVE_MAX_MS = 4000;

// Where each kind of page comes in from (the content moves from this offset to its place). Moves only, no
// scaling: a full-width picture (the home page's) visibly zooms at even 1.5%
const FROM: Record<Direction, string> = {
  next: 'translate3d(32px, 0, 0)',
  prev: 'translate3d(-32px, 0, 0)',
  in: 'translate3d(0, 16px, 0)',
  out: 'translate3d(0, -12px, 0)',
};
// Where the current page leans while the next one loads: away from the side the next comes in from
const AWAY: Record<Direction, string> = {
  next: 'translate3d(-10px, 0, 0)',
  prev: 'translate3d(10px, 0, 0)',
  in: 'translate3d(0, -4px, 0)',
  out: 'translate3d(0, 4px, 0)',
};

const html = (): HTMLElement => document.documentElement;

function pathAndOffset(url: string): { path: string; offset: number } | null {
  try {
    const parsed = new URL(url, window.location.href);
    return { path: parsed.pathname.replace(/\/+$/, '') || '/', offset: Number(parsed.searchParams.get('o')) || 0 };
  } catch {
    return null;
  }
}

/** Which way a navigation from the current page to `url` goes */
export function directionTo(url: string, tabs: string[] = currentTabs()): Direction {
  const from = pathAndOffset(window.location.href);
  const to = pathAndOffset(url);
  if (!from || !to) return 'in';
  if (from.path === to.path) return to.offset < from.offset ? 'prev' : 'next';
  const a = tabs.indexOf(from.path);
  const b = tabs.indexOf(to.path);
  if (a >= 0 && b >= 0) return b < a ? 'prev' : 'next';
  if (to.path.startsWith(`${from.path}/`) || /\/post\//.test(to.path)) return 'in';
  if (from.path.startsWith(`${to.path}/`)) return 'out';
  return 'in';
}

// The creator page's tabs, in order, as paths
function currentTabs(): string[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('#main .tabs a[href]'))
    .map((link) => pathAndOffset(link.href)?.path ?? '')
    .filter(Boolean);
}

// A top-level block of #main with a fixed-position element inside (the home page's full-screen background art)
// is never animated itself: an animated opacity, transform or filter makes the block a stacking context and the
// containing block of its fixed elements, so the art, which sits behind everything (z-index: -1), was painted
// over the sidebar for the length of the animation (the sidebar showed, went, and came back) and shrunk to the
// block. Instead the fixed element fades on its own (it is a stacking context already, so it stays behind) and
// the block's other parts (what stands beside it and beside its ancestors) move the way blocks do.
// A fixed element is a page-level thing (a background, an overlay) near the top of its block: the search goes a
// few levels deep and looks at the first and last children of long lists only. Walking every node (the tag
// cloud's 8000) cost ~100 ms of getComputedStyle in the very frame the page is revealed in.
const MAX_SCAN = 400;
const MAX_DEPTH = 4;
const HEAD = 12;
const TAIL = 4;
function markStill(): void {
  const main = document.querySelector('#main');
  if (!main) return;
  main.querySelectorAll(`[${FIXED}], [${PART}]`).forEach((node) => {
    node.removeAttribute(FIXED);
    node.removeAttribute(PART);
  });
  let budget = MAX_SCAN;
  const isFixed = (element: Element): boolean => budget-- > 0 && getComputedStyle(element).position === 'fixed';
  for (const block of Array.from(main.children)) {
    let still = isFixed(block);
    let found: Element | null = null;
    let level: Element[] = [block];
    for (let depth = 0; !still && depth < MAX_DEPTH && level.length && budget > 0; depth++) {
      const next: Element[] = [];
      for (const parent of level) {
        const children = parent.children;
        const count = children.length;
        for (let i = 0; i < count && !still; i++) {
          // The middle of a long list (cards, tags, comments) is more of the same
          if (count > HEAD + TAIL && i === HEAD) i = count - TAIL;
          const child = children[i];
          still = isFixed(child);
          if (still) found = child;
          next.push(child);
        }
        if (still || budget <= 0) break;
      }
      level = next;
    }
    if (block.hasAttribute(STILL) !== still) block.toggleAttribute(STILL, still);
    if (!found) continue;
    found.setAttribute(FIXED, '');
    for (let up: Element = found; up !== block && up.parentElement; up = up.parentElement) {
      for (const sibling of Array.from(up.parentElement.children)) if (sibling !== up) sibling.setAttribute(PART, '');
    }
  }
}

let pending: Direction | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
let enterTimer: ReturnType<typeof setTimeout> | undefined;
let enterToken = 0;

function stopLeaving(): void {
  clearTimeout(leaveTimer);
  html().removeAttribute(LEAVE);
}

function leave(direction: Direction): void {
  pending = direction;
  markStill();
  html().setAttribute(LEAVE, direction);
  clearTimeout(leaveTimer);
  // A request that never swaps (an error, a cancelled click) must not leave the page dimmed
  leaveTimer = setTimeout(stopLeaving, LEAVE_MAX_MS);
}

// The blocks of the page about to be shown were looked at a frame ahead (onBeforeReveal)
let stillMarked = false;

// Taking the attribute off restyles the whole page (its rules end in "> *"): not in the middle of a scroll
function whenIdle(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout: 500 });
  else fn();
}

function enter(): void {
  const direction = pending ?? 'in';
  pending = null;
  clearTimeout(enterTimer);
  if (!stillMarked) markStill();
  stillMarked = false;
  // From here on only attribute changes, no style read in between: one style pass for the whole reveal
  stopLeaving();
  // Restart the animation even when the previous one has not finished
  if (html().hasAttribute(ENTER)) {
    html().removeAttribute(ENTER);
    void html().offsetWidth;
  }
  html().setAttribute(ENTER, direction);
  const token = (enterToken += 1);
  enterTimer = setTimeout(() => whenIdle(() => token === enterToken && html().removeAttribute(ENTER)), ENTER_TOTAL_MS);
}

// A request for a whole page: a boosted link or form, or anything aimed at #main
function isPageRequest(detail: { boosted?: boolean; target?: Element } | undefined): boolean {
  if (!detail) return false;
  if (detail.boosted) return true;
  const target = detail.target;
  return !!target && (target.matches?.('#main, main, body') ?? false);
}

function styles(): string {
  const on = (direction: Direction): string => `html[${ENTER}="${direction}"]`;
  const keyframes = (Object.keys(FROM) as Direction[])
    .map((direction) => `@keyframes kdl-page-in-${direction} { from { opacity: 0; transform: ${FROM[direction]}; } }`)
    .join('\n');
  // What moves: the top-level blocks, and inside a block that has to stay still, its parts
  const MOVED = `:is(#main > :not([${STILL}]), #main > [${STILL}] [${PART}])`;
  const blocks = (Object.keys(FROM) as Direction[])
    .map((direction) => `${on(direction)} ${MOVED} { animation: kdl-page-in-${direction} ${ENTER_MS}ms ${EASE} backwards; }`)
    .join('\n');
  const stagger = Array.from({ length: BLOCKS - 1 }, (_, i) => `html[${ENTER}] #main > :nth-child(${i + 2}) { animation-delay: ${(i + 1) * STAGGER_MS}ms; }`).join('\n');
  const grid = 'html[' + ENTER + '] #main :is(.card-list__items, .kui-gallery-layout)';
  const cards = Array.from({ length: CARDS }, (_, i) => `${grid} > :nth-child(${i + 1}) { animation-delay: ${CARD_DELAY_MS + i * CARD_STAGGER_MS}ms; }`).join('\n');
  const leaving = (Object.keys(AWAY) as Direction[])
    .map((direction) => `html[${LEAVE}="${direction}"] ${MOVED} { transform: ${AWAY[direction]}; }`)
    .join('\n');
  return `
@media (prefers-reduced-motion: no-preference) {
${keyframes}
@keyframes kdl-card-in { from { opacity: 0; transform: translate3d(0, 14px, 0); } }
${blocks}
${stagger}
${grid} > :nth-child(-n+${CARDS}) { animation: kdl-card-in ${CARD_MS}ms ${EASE} backwards; }
${cards}
/* Fixed elements (the home page's full-screen background) fade on their own: see markStill */
html[${ENTER}] #main [${FIXED}] { animation: kdl-page-fade ${ENTER_MS}ms ease-out backwards; }
html[${LEAVE}] #main [${FIXED}] { opacity: 0.4; transition: opacity 220ms ease; }
@keyframes kdl-page-fade { from { opacity: 0; } }
html[${LEAVE}] ${MOVED} { opacity: 0.4; filter: saturate(0.6); transition: opacity 220ms ease, transform 320ms ${EASE}, filter 220ms ease; }
${leaving}
}
`;
}

export const pageTransitionsModule: KdlModule = {
  id: 'ui.pageTransitions',
  name: 'Page transitions',
  description:
    'Moving between pages animates: the next creator tab or page of posts slides in from its side, a post rises in, going back drops in, and cards cascade in as the loading skeleton dissolves. Follows the system "reduce motion" setting.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  requires: ['ui.shadcn'],
  styles,
  setup() {
    document.addEventListener('htmx:beforeRequest', (event) => {
      const detail = (event as CustomEvent).detail;
      if (!isPageRequest(detail)) return;
      const url = detail?.pathInfo?.finalRequestPath || detail?.pathInfo?.requestPath || detail?.requestConfig?.path;
      if (url) leave(directionTo(String(url)));
    });
    // The page did not change after all
    const cancel = (): void => {
      pending = null;
      stopLeaving();
    };
    document.addEventListener('htmx:responseError', cancel);
    // A boosted request that did not bring a new page (a form, a partial swap): undim right away
    document.addEventListener('htmx:afterRequest', () => {
      if (!isCloaked()) cancel();
    });
    document.addEventListener('htmx:sendError', cancel);
    window.addEventListener('popstate', () => {
      pending = 'out';
    });
    onCloak(() => {
      stillMarked = false;
      stopLeaving();
    });
    onBeforeReveal(() => {
      markStill();
      stillMarked = true;
    });
    onReveal(enter);
  },
};
