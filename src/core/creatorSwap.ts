// Same-creator navigation keeps the creator's header card and the tabs row on screen. Moving between a
// creator's tabs (Posts, Announcements, Tags, Linked accounts, Similar creators, Fancards, DMs...) or the
// pages and searches of the Posts tab, htmx would swap the whole #main: the header (banner, avatar, name, the
// site's and our buttons) and the tabs went away under the cloak and animated in again although nothing in
// them changed.
//
// Instead, once the answer is in (htmx:beforeSwap), a page of the same creator whose markup is the one we know
// is swapped in below the header only: htmx is pointed at the live section (`target`), told to take the
// section's other children from the answer (`selectOverride`) and to append them (`swapOverride`, the site's
// scroll modifiers kept). Everything else stays htmx's own: the history snapshot of the current page (taken
// before anything here changes the DOM), the pushed URL, the title, processing of the new nodes, settle.
// The old content goes right after the snapshot (htmx:pushedIntoHistory), in the same task as the swap, so no
// frame shows both or neither. The router then sets the page up in that same task (src/core/router.ts):
// the modules' header additions and the skin's tabs row are back before the first frame is painted, and only
// the part under the tabs is cloaked, given its skeleton and animated in.
//
// The site initialises a page from htmx:afterSettle when the swap's target holds #main (lazy card styles, the
// favourite button, favourite marks on cards, the linked-accounts tab); a section swap does not, so that event is
// sent once more for #main after the real one.
//
// Anything unexpected (another creator, an error page, markup that differs, no tabs row: the creator skin is
// off) leaves the request to the usual whole-page swap.
//
// A click on a creator tab also marks it active at once, put back before the history snapshot and when the
// request fails.

const CREATOR = /^\/([^/]+)\/user\/([^/?#]+)(?:\/([^/?#]+))?\/?$/;
const HEADER = ':scope > header.user-header';
const TABS_ROW = ':scope > .kdl-sk-tabs-row';
// The answer's section children other than its header (the tabs come inside #paginator-top)
const INCOMING = 'main#main > section.site-section--user > :not(header.user-header)';

/** The creator a path belongs to (`service/id`), for a creator's page or tab; not for posts */
function creatorOf(path: string | null): string | null {
  if (!path) return null;
  const match = CREATOR.exec(path);
  if (!match || match[3] === 'post') return null;
  try {
    return `${match[1].toLowerCase()}/${decodeURIComponent(match[2])}`;
  } catch {
    return `${match[1].toLowerCase()}/${match[2]}`;
  }
}

/** Both paths are pages of one creator (its tabs, pages and searches of its posts) */
export function sameCreator(from: string | null, to: string | null): boolean {
  const a = creatorOf(from);
  return a !== null && a === creatorOf(to);
}

// `stripped`: the page was just readied for its history snapshot, the skin's tabs row taken apart for it (a
// restore plans after that); the tabs are back in the paginator then
function liveSection(main: Element | null, stripped = false): HTMLElement | null {
  const section = main?.querySelector<HTMLElement>(':scope > section.site-section--user') ?? null;
  const tabs = section?.querySelector(TABS_ROW) || (stripped && section?.querySelector(':scope > #paginator-top > .tabs'));
  return section && section.querySelector(HEADER) && tabs ? section : null;
}

/** The creator page's header and tabs row can stay for a page of the same creator at `path` */
export function canKeepHeader(path: string | null): boolean {
  return sameCreator(window.location.pathname, path) && !!liveSection(document.querySelector('#main'));
}

interface Pending {
  section: HTMLElement;
  header: Element;
  attributes: Array<[string, string]>;
  cleared: boolean;
  settled: boolean;
  /** Back/forward from htmx's history cache (htmx:historyCacheHit), not a request */
  restore: boolean;
}

let pending: Pending | null = null;
let sectionRestore = false;

/** The swap htmx is doing is a same-creator section swap (planned in beforeSwap or historyCacheHit) */
export function isSectionSwap(event: Event): boolean {
  const target = (event as CustomEvent).detail?.target ?? event.target;
  return !!pending && target === pending.section;
}

/** The swap is a request's (set up at its afterSwap), not a history restore (set up at htmx:historyRestore) */
export function isSectionRequestSwap(event: Event): boolean {
  return isSectionSwap(event) && !pending?.restore;
}

/** htmx:historyRestore: the page htmx just restored went in under the kept header (asked once per restore) */
export function takeSectionRestore(): boolean {
  const was = sectionRestore;
  sectionRestore = false;
  return was;
}

const who = (node: Element): string => `${node.getAttribute('data-service') || ''}/${node.getAttribute('data-id') || ''}`;

/** The answer's or the cached page's creator section, when it is the live one's creator with the known markup */
function matchingSection(html: string, header: Element): Element | null {
  let next: Element | null = null;
  try {
    next = new DOMParser().parseFromString(html, 'text/html').querySelector('main#main > section.site-section--user');
  } catch {
    return null;
  }
  const nextHeader = next?.querySelector(HEADER);
  // The same creator by the markup too, the tabs where the skin lifts them from, something to show under them
  if (!next || !nextHeader || !next.querySelector(':scope > #paginator-top > .tabs') || next.children.length < 2) return null;
  return who(nextHeader) === who(header) ? next : null;
}

// The site's swap spec (`outerHTML show:window:top`) with its style replaced: the scroll and timing stay
function appendSpec(detail: { swapOverride?: string; elt?: Element }): string {
  const spec = detail.swapOverride || detail.elt?.closest?.('[hx-swap]')?.getAttribute('hx-swap') || document.body.getAttribute('hx-swap') || '';
  const parts = spec.split(/\s+/).filter(Boolean);
  if (parts.length && !parts[0].includes(':')) parts.shift();
  return ['beforeend', ...parts].join(' ');
}

/** htmx:beforeSwap (before anyone else sees it): retargets a same-creator page swap to the part under the tabs.
    `root` is the router's #main, `nextPath` the address the answer is for. */
export function planSectionSwap(event: Event, root: Element, nextPath: string | null): boolean {
  pending = null;
  const detail = (event as CustomEvent).detail;
  if (!detail || !detail.boosted || !detail.shouldSwap || detail.isError || detail.xhr?.status !== 200) return false;
  if (detail.target !== root || typeof detail.serverResponse !== 'string') return false;
  if (detail.selectOverride && detail.selectOverride !== '#main') return false;
  if (!sameCreator(window.location.pathname, nextPath)) return false;
  const section = liveSection(root);
  const header = section?.querySelector(HEADER);
  const next = section && header ? matchingSection(detail.serverResponse, header) : null;
  if (!section || !header || !next) return false;
  detail.target = section;
  detail.selectOverride = INCOMING;
  detail.swapOverride = appendSpec(detail);
  pending = { section, header, attributes: Array.from(next.attributes).map((a) => [a.name, a.value]), cleared: false, settled: false, restore: false };
  return true;
}

/** htmx:historyCacheHit (back/forward to a page htmx has cached; the current page's snapshot is already taken):
    the same for a cached page of the same creator. htmx swaps `item.content` (the page's <body>) into
    `historyElt` with `swapSpec`, all read back after this event: they become the section's other children, the
    live section and an append. */
function planSectionRestore(event: Event): void {
  pending = null;
  sectionRestore = false;
  const detail = (event as CustomEvent).detail;
  const item = detail?.item;
  if (!detail?.swapSpec || typeof item?.content !== 'string' || !detail.historyElt) return;
  let path: string | null = null;
  try {
    path = new URL(String(detail.path || ''), window.location.href).pathname;
  } catch {
    return;
  }
  // The page being left is a creator page (it has the header and the tabs row); the cached one names the same
  // creator in its markup
  const main = document.querySelector('#main');
  const section = creatorOf(path) && main && detail.historyElt.contains(main) ? liveSection(main, true) : null;
  const header = section?.querySelector(HEADER);
  const next = section && header ? matchingSection(item.content, header) : null;
  if (!section || !header || !next) return;
  const nextHeader = next.querySelector(HEADER);
  item.content = Array.from(next.children).filter((child) => child !== nextHeader).map((child) => child.outerHTML).join('');
  detail.historyElt = section;
  detail.swapSpec.swapStyle = 'beforeend';
  pending = { section, header, attributes: Array.from(next.attributes).map((a) => [a.name, a.value]), cleared: false, settled: false, restore: true };
  sectionRestore = true;
  clearOld();
}

// The section takes the answer's attributes (its classes name the tab: site-section--linked-account...); ours stay
function takeAttributes(section: HTMLElement, attributes: Array<[string, string]>): void {
  const names = new Set(attributes.map(([name]) => name));
  Array.from(section.attributes).forEach(({ name }) => {
    if (!names.has(name) && !/^(data-)?kdl-|^data-kui/.test(name)) section.removeAttribute(name);
  });
  attributes.forEach(([name, value]) => {
    if (section.getAttribute(name) !== value) section.setAttribute(name, value);
  });
}

// Everything under the header goes: the tabs row too (the snapshot may have put the tabs back in the paginator
// already); the answer brings its own tabs, which the skin lifts into a row again before the first frame
function clearOld(): void {
  if (!pending || pending.cleared) return;
  pending.cleared = true;
  const { section, header } = pending;
  Array.from(section.children).forEach((child) => {
    if (child !== header && !child.classList.contains('htmx-added')) child.remove();
  });
  takeAttributes(section, pending.attributes);
}

/** htmx:afterSwap of a section swap, before the router sets the page up: anything the snapshot step did not
    clear goes now (same task), and the site sets the new content up (see the header comment). That is done
    before our modules add their blocks, as after a whole-page swap: the site's set-up marks every link around
    an image in the page (fixImageLinks), and ours (similar creators, the overview) must not get its class. */
export function finishSectionSwap(): void {
  clearOld();
  if (!pending || pending.restore || pending.settled) return;
  pending.settled = true;
  const main = document.querySelector('#main');
  // A history restore needs none of this: the site sets the page up from htmx:historyRestore itself
  if (main) document.body.dispatchEvent(new CustomEvent('htmx:afterSettle', { bubbles: true, detail: { target: main, elt: main, kdlReplay: true } }));
}

/** htmx:afterSettle of a section swap: done */
function settled(event: Event): void {
  if (pending && !(event as CustomEvent).detail?.kdlReplay && isSectionSwap(event)) pending = null;
}

// ---- The active tab, at once ----

let marked: { link: HTMLAnchorElement; previous: Element[] } | null = null;

function unmark(): void {
  if (!marked) return;
  const { link, previous } = marked;
  marked = null;
  if (!link.isConnected) return;
  link.classList.remove('active');
  previous.forEach((node) => node.classList.add('active'));
}

function markTab(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('#main .site-section--user .tabs a[href]');
  if (!link || link.classList.contains('active') || (link.target && link.target !== '_self')) return;
  if (document.body?.getAttribute('hx-boost') !== 'true' || link.closest('[hx-boost="false"]')) return;
  let path: string;
  try {
    path = new URL(link.href, window.location.href).pathname;
  } catch {
    return;
  }
  if (!sameCreator(window.location.pathname, path)) return;
  unmark();
  const tabs = link.closest('.tabs');
  const previous = tabs ? Array.from(tabs.querySelectorAll('a.active')) : [];
  previous.forEach((node) => node.classList.remove('active'));
  link.classList.add('active');
  marked = { link, previous };
}

let installed = false;
let enabled: () => boolean = () => true;

/** Listeners of the section swap and the tab marking (the router calls planSectionSwap/finishSectionSwap).
    `isEnabled`: whether section swaps may be planned now (the redesign, whose cloak and tabs row they need) */
export function installCreatorSwap(isEnabled: () => boolean): void {
  if (installed) return;
  installed = true;
  enabled = isEnabled;
  document.addEventListener('click', markTab, true);
  // Before the snapshot is cloned: it must show the tab the page was opened with
  window.addEventListener('htmx:beforeHistorySave', unmark, true);
  // A request that brought no page: the tab that is open again (after a swap the marked link is gone)
  document.addEventListener('htmx:afterRequest', unmark);
  // Right after the snapshot of the current page was taken, before the new content goes in
  document.addEventListener('htmx:pushedIntoHistory', clearOld);
  document.addEventListener('htmx:afterSettle', settled);
  document.addEventListener('htmx:historyCacheHit', (event) => {
    if (enabled()) planSectionRestore(event);
  });
  // The request failed before a swap: nothing of the plan applies
  for (const name of ['htmx:responseError', 'htmx:sendError', 'htmx:swapError']) document.addEventListener(name, () => (pending = null));
}
