// Infinite scroll for the site's paginated card lists (/posts, popular, creator posts, /artists, /dms, favourites):
// near the end of the list the next page's HTML (the paginator's "next" link) is fetched and its cards are
// appended to the current grid. The cards keep the site's own markup, so every module that works on cards
// (download buttons, checkboxes, quick favourites, hidden creators, smooth thumbnails, viewed marks, site
// translation) picks them up through the router's mutation pass, like cards of a freshly loaded page.
//
// The URL stays the first page's. Appended cards never go into htmx's history snapshot; they are kept here
// (as the markup the server sent) with the scroll position, and put back when the user returns with Back.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { button, ensureKit, kitIcon, kitScope } from '../../ui/kit';
import { t } from '../../i18n';

export const INFINITE_SCROLL_ID = 'lists.infiniteScroll';

const CARD = 'article.post-card, a.user-card, .dm-card';
const NEXT_LINK = '.paginator menu a.next[href]';
const FOOTER_ID = 'kdl-iscroll';
const RANGE_ID = 'kdl-iscroll-range';
const HIDE_ATTR = 'data-kdl-iscroll-hidden';
const ADDED_ATTR = 'data-kdl-iscroll';
const ROOT_MARGIN = 1200;
const CHUNK = 12;
const REQUEST_TIMEOUT_MS = 20000;
const RESTORE_WINDOW_MS = 4000;
const CACHE_ENTRIES = 3;
// Pages that bring nothing new in a row (offsets shifted by new posts) before giving up
const MAX_EMPTY_PAGES = 2;
// Tag pages have their own tools; post pages and other creator tabs have no card pagination
const EXCLUDED_PATH = /(^|\/)tags\/?$|\/post\//;

type Status = 'idle' | 'loading' | 'manual' | 'error' | 'end';

interface Range {
  from: number;
  to: number;
  total: number | null;
}

interface Target {
  list: HTMLElement;
  cardList: HTMLElement;
  next: string;
}

interface Saved {
  html: string[];
  next: string | null;
  range: Range | null;
  scrollY: number;
}

interface State {
  target: Target;
  href: string;
  next: string | null;
  /** Server markup of every appended card, in order (what a Back restores) */
  html: string[];
  added: HTMLElement[];
  keys: Set<string>;
  range: Range | null;
  status: Status;
  emptyPages: number;
  /** Offset step between pages (o=0, 50, 100…) */
  step: number;
  controller: AbortController | null;
  seq: number;
  hidden: HTMLElement[];
  footer: HTMLElement;
  statusText: HTMLElement;
  spinner: SVGElement;
  actions: HTMLElement;
  rangeNode: HTMLElement | null;
}

let ctxRef: ModuleContext | null = null;
let state: State | null = null;
let observer: IntersectionObserver | null = null;
let styleObserver: IntersectionObserver | null = null;
let restoreAt = 0;
const cache = new Map<string, Saved>();
const DBG = ((window as any).__iscrollDbg = [] as string[]); // DEBUG
const dbg = (m: string) => DBG.push(Math.round(performance.now()) + ' ' + m); // DEBUG

// ---- page reading ----

/** One page of a list: a hash jump is not another page */
const pageKey = (): string => window.location.pathname + window.location.search;

function sameOrigin(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}

function findTarget(): Target | null {
  if (EXCLUDED_PATH.test(window.location.pathname)) return null;
  const list = document.querySelector<HTMLElement>('#main .card-list__items, .card-list__items');
  const cardList = list?.closest<HTMLElement>('.card-list');
  if (!list || !cardList || !list.querySelector(CARD)) return null;
  const next = sameOrigin(document.querySelector<HTMLAnchorElement>(NEXT_LINK)?.getAttribute('href'));
  if (!next) return null;
  return { list, cardList, next };
}

/** "Showing 1 - 50 of 668" (any language: the numbers keep their order) */
function readRange(scope: ParentNode): Range | null {
  const small = scope.querySelector('#paginator-top > small, .paginator > small');
  // Thousands separators (1,234 / 1 234) would split a number in two
  const text = (small?.textContent ?? '').replace(/(\d)[,.   ](?=\d{3}\b)/g, '$1');
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length < 2) return null;
  return { from: numbers[0], to: numbers[1], total: numbers.length > 2 ? numbers[2] : null };
}

function offsetOf(href: string): number {
  try {
    return Number(new URL(href, window.location.href).searchParams.get('o')) || 0;
  } catch {
    return 0;
  }
}

/** The next page when the fetched one has no paginator of its own (drawn by the site's script): same step on */
function steppedNext(s: State, url: string, count: number): string | null {
  if (s.step <= 0 || count < s.step) return null;
  const offset = offsetOf(url) + s.step;
  if (s.range?.total != null && offset >= s.range.total) return null;
  const next = new URL(url);
  next.searchParams.set('o', String(offset));
  return next.href;
}

function cardKey(card: Element): string {
  const { id, service } = (card as HTMLElement).dataset;
  if (id) return `${service ?? ''}:${id}`;
  const href = card.matches('a[href]') ? card.getAttribute('href') : card.querySelector('a[href]')?.getAttribute('href');
  return `${href ?? ''}|${(card.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160)}`;
}

function cardCount(): number {
  return state ? state.target.list.querySelectorAll(CARD).length : 0;
}

function maxCards(): number {
  return ctxRef?.settings.get<number>('maxCards') ?? 600;
}

function autoLoad(): boolean {
  return (ctxRef?.settings.get<boolean>('auto') ?? true) && typeof IntersectionObserver === 'function';
}

/** The live post search shows its own results in the list: no pages under them */
function searchIsLive(): boolean {
  return !!state?.target.list.querySelector('[data-kdl-live]');
}

// ---- appending ----

// rAF never fires in a background tab: a timer stands in
function nextFrame(fn: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 100);
}

/** Banners of creator cards: the site applies `data-style` lazily, for its own cards only */
function lazyStyle(card: HTMLElement): void {
  const targets = [card, ...Array.from(card.querySelectorAll<HTMLElement>('[data-style]'))].filter((node) => node.dataset.style && !node.getAttribute('style'));
  if (!targets.length) return;
  if (typeof IntersectionObserver !== 'function') {
    targets.forEach((node) => (node.style.cssText = node.dataset.style ?? ''));
    return;
  }
  styleObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target as HTMLElement;
        node.style.cssText = node.dataset.style ?? '';
        styleObserver?.unobserve(node);
      });
    },
    { rootMargin: '400px 0px' }
  );
  targets.forEach((node) => styleObserver!.observe(node));
}

function prepareCard(source: Element): HTMLElement {
  const card = document.importNode(source, true) as HTMLElement;
  card.setAttribute(ADDED_ATTR, '');
  card.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
  return card;
}

/** Cards in small batches, one per frame, so a page of 50 never becomes one long task */
function appendCards(s: State, cards: HTMLElement[], seq: number): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    const step = () => {
      if (state !== s || s.seq !== seq || !s.target.list.isConnected) return resolve();
      const fragment = document.createDocumentFragment();
      const batch = cards.slice(index, index + CHUNK);
      fragment.append(...batch);
      s.target.list.append(fragment);
      batch.forEach(lazyStyle);
      s.added.push(...batch);
      index += CHUNK;
      if (index < cards.length) nextFrame(step);
      else resolve();
    };
    step();
  });
}

// ---- UI ----

function setStatus(s: State, status: Status): void {
  s.status = status;
  s.footer.dataset.status = status;
  const busy = status === 'loading';
  s.spinner.style.display = busy ? '' : 'none';
  s.statusText.textContent =
    status === 'loading' ? t('iscroll.loading') : status === 'end' ? t('iscroll.end') : status === 'error' ? t('iscroll.failed') : '';
  s.actions.replaceChildren();
  if (status === 'manual') {
    s.actions.append(button({ label: t('iscroll.loadMore'), icon: 'chevron-down', variant: 'outline', onClick: () => void loadNext(true) }));
  } else if (status === 'error') {
    s.actions.append(button({ label: t('iscroll.retry'), icon: 'refresh-cw', variant: 'outline', size: 'sm', onClick: () => void loadNext(true) }));
    if (s.next) s.actions.append(button({ label: t('iscroll.openPage'), href: s.next, variant: 'ghost', size: 'sm' }));
  }
}

function renderRange(s: State): void {
  const range = s.range;
  if (!range || !s.rangeNode) return;
  s.rangeNode.textContent = range.total !== null ? t('iscroll.range', { from: range.from, to: range.to, total: range.total }) : t('iscroll.rangeNoTotal', { from: range.from, to: range.to });
}

function buildFooter(): Pick<State, 'footer' | 'statusText' | 'spinner' | 'actions'> {
  ensureKit();
  const spinner = kitIcon('loader-circle', 'kdl-ui-spin');
  const statusText = el('span', { className: 'kdl-iscroll__text' });
  const status = el('div', { className: 'kdl-iscroll__status' }, [spinner, statusText]);
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const actions = el('div', { className: 'kdl-iscroll__actions' });
  const footer = kitScope([status, actions], { className: 'kdl-iscroll' });
  footer.id = FOOTER_ID;
  return { footer, statusText, spinner, actions };
}

/** Bottom paginator off (on /posts/popular the paginator wraps the card list: only its controls then) */
function hidePagination(s: State): void {
  const hide: HTMLElement[] = [];
  const bottom = document.getElementById('paginator-bottom');
  if (bottom) {
    if (bottom.contains(s.target.list)) hide.push(...Array.from(bottom.querySelectorAll<HTMLElement>(':scope > menu, :scope > small')));
    else hide.push(bottom);
  }
  const small = document.querySelector<HTMLElement>('#paginator-top > small');
  if (small && s.range) {
    hide.push(small);
    s.rangeNode = el('small', { className: 'kdl-iscroll-range' });
    s.rangeNode.id = RANGE_ID;
    small.after(s.rangeNode);
    renderRange(s);
  }
  hide.forEach((node) => node.setAttribute(HIDE_ATTR, ''));
  s.hidden = hide;
}

function showPagination(s: State): void {
  s.hidden.forEach((node) => node.removeAttribute(HIDE_ATTR));
  s.hidden = [];
  s.rangeNode?.remove();
  s.rangeNode = null;
}

function mountUi(s: State): void {
  s.target.cardList.append(s.footer);
  hidePagination(s);
}

function unmountUi(s: State): void {
  s.footer.remove();
  showPagination(s);
}

// ---- loading ----

function idleStatus(s: State): Status {
  if (!s.next) return 'end';
  return autoLoad() && cardCount() < maxCards() ? 'idle' : 'manual';
}

/** Re-observing makes the observer report the footer's position again: more pages while it is still near */
function watch(s: State): void {
  if (!observer || state !== s) return;
  observer.unobserve(s.footer);
  if (s.status === 'idle') observer.observe(s.footer);
}

async function fetchDocument(url: string, signal: AbortSignal): Promise<Document> {
  const timer = setTimeout(() => controllerAbort(signal), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { credentials: 'same-origin', signal, headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  } finally {
    clearTimeout(timer);
  }
}

// AbortSignal.timeout is not on every host: the state's controller is aborted instead
function controllerAbort(signal: AbortSignal): void {
  if (state?.controller?.signal === signal) state.controller.abort();
}

async function loadNext(manual = false): Promise<void> {
  const s = state;
  if (!s || !s.next || s.status === 'loading' || searchIsLive()) return;
  if (!manual && s.status !== 'idle') return;
  const seq = ++s.seq;
  const url = s.next;
  s.controller = new AbortController();
  setStatus(s, 'loading');
  try {
    const doc = await fetchDocument(url, s.controller.signal);
    if (state !== s || s.seq !== seq) return;
    const sources = Array.from(doc.querySelectorAll('.card-list__items')).flatMap((list) => Array.from(list.children).filter((child) => child.matches(CARD)));
    // An app shell (kemono.cr renders its lists in the browser) has no cards to take
    if (!sources.length && !doc.querySelector('.card-list__items')) throw new Error('no card list');
    const fresh: HTMLElement[] = [];
    sources.forEach((source) => {
      const key = cardKey(source);
      if (s.keys.has(key)) return;
      s.keys.add(key);
      s.html.push(source.outerHTML);
      fresh.push(prepareCard(source));
    });
    const range = readRange(doc);
    if (range && s.range) s.range = { from: s.range.from, to: range.to, total: range.total ?? s.range.total };
    s.next = sameOrigin(doc.querySelector<HTMLAnchorElement>(NEXT_LINK)?.getAttribute('href')) ?? steppedNext(s, url, sources.length);
    if (s.next === url) s.next = null;
    s.emptyPages = fresh.length ? 0 : s.emptyPages + 1;
    if (s.emptyPages >= MAX_EMPTY_PAGES) s.next = null;
    await appendCards(s, fresh, seq);
    if (state !== s || s.seq !== seq) return;
    // A page whose paginator the site draws in the browser (/artists) says nothing about the range
    if (!range && s.range) s.range = { ...s.range, to: s.range.from - 1 + cardCount() };
    renderRange(s);
    s.controller = null;
    setStatus(s, idleStatus(s));
    watch(s);
  } catch (error) {
    if (state !== s || s.seq !== seq) return;
    s.controller = null;
    ctxRef?.log('next page failed:', error);
    setStatus(s, 'error');
  }
}

// ---- lifecycle ----

function attach(target: Target): void {
  dbg('attach ' + pageKey() + ' cache=' + [...cache.keys()].join(',') + ' restoreAge=' + (Date.now() - restoreAt)); // DEBUG
  const parts = buildFooter();
  const s: State = {
    target,
    href: pageKey(),
    next: target.next,
    html: [],
    added: [],
    keys: new Set(Array.from(target.list.querySelectorAll(CARD)).map(cardKey)),
    range: readRange(document),
    status: 'idle',
    emptyPages: 0,
    step: offsetOf(target.next) - offsetOf(window.location.href),
    controller: null,
    seq: 0,
    hidden: [],
    rangeNode: null,
    ...parts,
  };
  state = s;
  // Back to this page: the cards appended before come back (no refetch), then the scroll position
  const saved = cache.get(s.href);
  const restoring = !!saved && Date.now() - restoreAt < RESTORE_WINDOW_MS;
  if (saved && restoring) {
    cache.delete(s.href);
    const cards: HTMLElement[] = [];
    const parser = document.createElement('template');
    saved.html.forEach((html) => {
      parser.innerHTML = html;
      const source = parser.content.firstElementChild;
      if (!source || s.keys.has(cardKey(source))) return;
      s.keys.add(cardKey(source));
      s.html.push(html);
      cards.push(prepareCard(source));
    });
    target.list.append(...cards);
    cards.forEach(lazyStyle);
    s.added.push(...cards);
    s.next = saved.next;
    if (saved.range) s.range = saved.range;
  }
  mountUi(s);
  setStatus(s, idleStatus(s));
  if (restoring && saved) {
    window.scrollTo(0, saved.scrollY);
    // htmx and the browser restore the position too, against the short page: have the last word
    nextFrame(() => {
      if (state === s && Math.abs(window.scrollY - saved.scrollY) > 2) window.scrollTo(0, saved.scrollY);
    });
  }
  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadNext();
    }, { rootMargin: `0px 0px ${ROOT_MARGIN}px 0px` });
    watch(s);
  }
}

function detach(removeCards: boolean): void {
  dbg('detach ' + removeCards); // DEBUG
  const s = state;
  if (!s) return;
  s.seq++;
  s.controller?.abort();
  observer?.disconnect();
  observer = null;
  styleObserver?.disconnect();
  styleObserver = null;
  unmountUi(s);
  if (removeCards) s.added.forEach((card) => card.remove());
  state = null;
}

function sync(): void {
  if (state && state.target.list.isConnected && state.href === pageKey()) {
    // The live search took the list over and gave it back: carry on
    if (state.status === 'idle') watch(state);
    return;
  }
  if (state) detach(state.target.list.isConnected);
  const target = findTarget();
  if (target) attach(target);
}

/** What a Back to this page puts back */
function remember(s: State): void {
  dbg('remember ' + s.href + ' n=' + s.html.length + ' y=' + window.scrollY); // DEBUG
  if (!s.html.length) return;
  cache.delete(s.href);
  cache.set(s.href, { html: s.html.slice(), next: s.next, range: s.range, scrollY: window.scrollY });
  while (cache.size > CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
}

const styles = `
.kdl-iscroll {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 64px;
  margin: 12px 0 4px;
  padding: 8px 0;
  color: var(--kdl-muted-foreground);
  font-size: 13px;
  box-sizing: border-box;
}
.kdl-iscroll__status { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 20px; }
.kdl-iscroll__status:empty, .kdl-iscroll__actions:empty { display: none; }
.kdl-iscroll__status > .kdl-ui-icon { width: 16px; height: 16px; flex: none; }
.kdl-iscroll__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.kdl-iscroll[data-status="idle"] .kdl-iscroll__status { visibility: hidden; }
.kdl-iscroll[data-status="end"] .kdl-iscroll__status { width: min(100%, 360px); }
.kdl-iscroll[data-status="end"] .kdl-iscroll__status::before,
.kdl-iscroll[data-status="end"] .kdl-iscroll__status::after { content: ""; flex: 1; height: 1px; background: var(--kdl-border); }
.kdl-iscroll[data-status="error"] .kdl-iscroll__text { color: var(--kdl-danger); }
[${HIDE_ATTR}] { display: none !important; }
`;

export const infiniteScrollModule: KdlModule = {
  id: INFINITE_SCROLL_ID,
  name: 'Infinite scroll',
  description:
    'Lists load the next page by themselves as you reach the end (posts, popular, creator posts, creators, DMs, favourites) instead of switching pages. The address stays on the first page; Back returns to where you were.',
  group: 'Lists',
  pages: ['list', 'creator', 'artists', 'search', 'other'],
  defaultEnabled: false,
  settings: [
    { key: 'auto', label: 'Load automatically while scrolling', type: 'boolean', default: true, hint: 'Off: a “Load more” button at the end of the list.' },
    { key: 'maxCards', label: 'Ask before loading more than this many cards', type: 'number', default: 600, min: 100, max: 3000, hint: 'Past it, a “Load more” button keeps long sessions light.' },
  ],
  styles,
  setup() {
    // Only a Back/Forward brings appended cards back; a fresh visit of the same address starts at page one
    const restoring = (e: Event) => { restoreAt = Date.now(); dbg('restore-evt ' + e.type); }; // DEBUG
    window.addEventListener('popstate', restoring);
    document.addEventListener('htmx:historyRestore', restoring);
    document.addEventListener('htmx:historyCacheMiss', restoring);
  },
  mount(ctx) {
    ctxRef = ctx;
    sync();
    const refresh = () => {
      if (!state || state.status === 'loading' || state.status === 'error') return;
      setStatus(state, idleStatus(state));
      watch(state);
    };
    ctx.settings.onChange('auto', refresh);
    ctx.settings.onChange('maxCards', refresh);
    ctx.onCleanup(() => {
      // Leaving the page: the router unmounts before htmx takes its snapshot, which then holds the first page only
      if (state) remember(state);
      detach(true);
      ctxRef = null;
    });
  },
  update() {
    sync();
  },
  beforeSnapshot() {
    const s = state;
    if (!s) return;
    remember(s);
    // The snapshot holds the first page as the server sent it
    const added = s.added.filter((card) => card.parentNode === s.target.list);
    added.forEach((card) => card.remove());
    unmountUi(s);
    // Still here after the snapshot (no swap followed): put everything back
    setTimeout(() => {
      if (state !== s || !s.target.list.isConnected || s.href !== pageKey()) return;
      s.target.list.append(...added);
      mountUi(s);
      setStatus(s, s.status);
      watch(s);
    }, 0);
  },
};
