// The last, incomplete row of a card grid (50 posts over 8 columns leave 2) is centred instead of hugging the left.
// Grids fill columns with auto-fill, so the column count is only known at run time: the cards of the last row get
// a horizontal `translate` of half the free width. `translate` (not `transform`) composes with the cards' own
// entrance animation, and it moves nothing else: the rest of the row is empty. Recomputed when the grid resizes
// or its cards change (infinite scroll, hidden creators, live search).

const GRID = '#main .card-list__items';
const ATTR = 'data-kdl-tail';
const VAR = '--kdl-tail-shift';

const observed = new Map<HTMLElement, MutationObserver>();
let resize: ResizeObserver | null = null;
let frame = 0;
const dirty = new Set<HTMLElement>();

function clear(list: HTMLElement): void {
  list.querySelectorAll<HTMLElement>(`:scope > [${ATTR}]`).forEach((card) => {
    card.removeAttribute(ATTR);
    card.style.removeProperty(VAR);
  });
}

function layout(list: HTMLElement): void {
  clear(list);
  const style = getComputedStyle(list);
  if (style.display !== 'grid') return;
  const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length;
  const cards = Array.from(list.children).filter((card): card is HTMLElement => card instanceof HTMLElement && card.getClientRects().length > 0);
  const rest = cards.length % columns;
  if (columns < 2 || !rest || cards.length < columns) return;
  const tail = cards.slice(-rest);
  // Every card of the row must sit in the same grid row (a full-width notice would break the count)
  const top = tail[0].offsetTop;
  if (tail.some((card) => card.offsetTop !== top)) return;
  const step = cards[1].offsetLeft - cards[0].offsetLeft;
  if (!(step > 0)) return;
  const shift = ((columns - rest) * step) / 2;
  tail.forEach((card) => {
    card.setAttribute(ATTR, '');
    card.style.setProperty(VAR, `${Math.round(shift * 10) / 10}px`);
  });
}

function schedule(list: HTMLElement): void {
  dirty.add(list);
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    dirty.forEach((item) => item.isConnected && layout(item));
    dirty.clear();
  });
}

function forget(list: HTMLElement): void {
  observed.get(list)?.disconnect();
  observed.delete(list);
  resize?.unobserve(list);
  clear(list);
}

/** Picks up the grids of the current page (idempotent; runs on every page update) */
export function syncCenterTail(): void {
  observed.forEach((_, list) => { if (!list.isConnected) forget(list); });
  if (typeof ResizeObserver !== 'function') return;
  resize ??= new ResizeObserver((entries) => entries.forEach((entry) => schedule(entry.target as HTMLElement)));
  document.querySelectorAll<HTMLElement>(GRID).forEach((list) => {
    if (observed.has(list)) return schedule(list);
    const mutations = new MutationObserver(() => schedule(list));
    mutations.observe(list, { childList: true });
    observed.set(list, mutations);
    resize!.observe(list);
    schedule(list);
  });
}

/** Takes the shifts off (before an htmx snapshot) */
export function clearCenterTail(): void {
  document.querySelectorAll<HTMLElement>(GRID).forEach(clear);
}

export function installCenterTail(): () => void {
  syncCenterTail();
  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    observed.forEach((_, list) => forget(list));
    resize?.disconnect();
    resize = null;
  };
}

export const centerTailCss = `.card-list__items > [${ATTR}] { translate: var(${VAR}, 0) 0; }`;
