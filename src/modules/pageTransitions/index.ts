// Page transitions: navigating between pages (creator tabs, post list pages, into a post and back) animates.
// While the next page loads, the current one dims and leans towards where the next comes from; the loading
// skeleton then dissolves as the new page slides in from that side, its card grid cascading in.
//
// The direction comes from the navigation: the next/previous creator tab or list page slides sideways, going
// into a page (a creator's post) rises from below, going back drops in from above. Rides on the page cloak
// (src/core/cloak.ts): the enter animation plays when a hidden page is shown, so it only exists with the
// redesign, and never on a page the user already sees.

import { isCloaked, onCloak, onReveal } from '../../core/cloak';
import type { KdlModule } from '../../core/types';

const LEAVE = 'data-kdl-leave';
const ENTER = 'data-kdl-enter';
const STILL = 'data-kdl-still';
type Direction = 'next' | 'prev' | 'in' | 'out';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const ENTER_MS = 420;
const STAGGER_MS = 40;
const BLOCKS = 6;
const CARDS = 24;
const CARD_STAGGER_MS = 18;
// Long enough for the last staggered card; a hidden or slow page must not keep the attribute
const ENTER_TOTAL_MS = ENTER_MS + CARDS * CARD_STAGGER_MS + 120;
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

// Top-level blocks of #main with a fixed-position element inside: animated by opacity only
const MAX_SCAN = 5000;
function markStill(): void {
  const main = document.querySelector('#main');
  if (!main) return;
  let budget = MAX_SCAN;
  for (const block of Array.from(main.children)) {
    let still = getComputedStyle(block).position === 'fixed';
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_ELEMENT);
    while (!still && budget-- > 0 && walker.nextNode()) still = getComputedStyle(walker.currentNode as Element).position === 'fixed';
    block.toggleAttribute(STILL, still);
  }
}

let pending: Direction | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
let enterTimer: ReturnType<typeof setTimeout> | undefined;

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

function enter(): void {
  const direction = pending ?? 'in';
  pending = null;
  stopLeaving();
  clearTimeout(enterTimer);
  markStill();
  // Restart the animation even when the previous one has not finished
  html().removeAttribute(ENTER);
  void html().offsetWidth;
  html().setAttribute(ENTER, direction);
  enterTimer = setTimeout(() => html().removeAttribute(ENTER), ENTER_TOTAL_MS);
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
    .map((direction) => `@keyframes kdl-page-in-${direction} { from { opacity: 0; transform: ${FROM[direction]}; filter: blur(3px); } }`)
    .join('\n');
  const blocks = (Object.keys(FROM) as Direction[])
    .map((direction) => `${on(direction)} #main > * { animation: kdl-page-in-${direction} ${ENTER_MS}ms ${EASE} backwards; }`)
    .join('\n');
  const stagger = Array.from({ length: BLOCKS - 1 }, (_, i) => `html[${ENTER}] #main > :nth-child(${i + 2}) { animation-delay: ${(i + 1) * STAGGER_MS}ms; }`).join('\n');
  const grid = 'html[' + ENTER + '] #main :is(.card-list__items, .kui-gallery-layout)';
  const cards = Array.from({ length: CARDS }, (_, i) => `${grid} > :nth-child(${i + 1}) { animation-delay: ${120 + i * CARD_STAGGER_MS}ms; }`).join('\n');
  const leaving = (Object.keys(AWAY) as Direction[])
    .map((direction) => `html[${LEAVE}="${direction}"] #main > * { transform: ${AWAY[direction]}; }`)
    .join('\n');
  return `
@media (prefers-reduced-motion: no-preference) {
${keyframes}
@keyframes kdl-card-in { from { opacity: 0; transform: translate3d(0, 14px, 0); } }
${blocks}
${stagger}
${grid} > * { animation: kdl-card-in 520ms ${EASE} backwards; animation-delay: ${120 + CARDS * CARD_STAGGER_MS}ms; }
${cards}
/* A block holding fixed elements (the home page's full-screen background) only fades: a transform or filter
   on it would make it their containing block, shrinking them to the block for the length of the animation */
html[${ENTER}] #main > [${STILL}] { animation-name: kdl-page-fade; }
html[${LEAVE}] #main > [${STILL}] { transform: none; filter: none; }
@keyframes kdl-page-fade { from { opacity: 0; } }
html[${LEAVE}] #main > * { opacity: 0.4; filter: saturate(0.6); transition: opacity 220ms ease, transform 320ms ${EASE}, filter 220ms ease; }
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
    onCloak(stopLeaving);
    onReveal(enter);
  },
};
