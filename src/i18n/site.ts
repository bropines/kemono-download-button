// Translates the site's own chrome (sidebar, header, headings, buttons, pagination...) with the `site`
// dictionary of the active language. Only text inside SITE_SCOPES is touched and never inside SITE_SKIP,
// so posts, comments, names and tags stay as written. Every change is remembered and undone on disable,
// on a language switch and before htmx stores a history snapshot (cached pages stay English).
import type { KdlModule } from '../core/types';
import { getLanguage, onLanguageChange, translateSiteText } from './index';

/** Site chrome: the only places text is translated. */
export const SITE_SCOPES = [
  '.global-sidebar',
  '.content-wrapper > .header',
  // Import status: the card and the log toolbar (not the log lines, which name posts and creators)
  '.import__card',
  // The DM notice above it (?dms=1): text around the link and the code, translated piece by piece
  '.site-section--importer-status > .jumbo.no-posts',
  '.import__logs-head',
  '.import__reverse',
  '.loading-placeholder',
  '.site-section__header',
  '.site-section__heading',
  '.site-section__subheading',
  '.paginator',
  '.tabs',
  '.search-form',
  '.search-bar',
  '.hide-tags-filter',
  '.post__nav-links',
  '.post__published',
  '.post__added',
  '#post-tags > #label',
  '.post__actions',
  '.post__body > h2',
  '.post__body > .kui-post-section > h2',
  '.post__footer > h2',
  '.post-card__footer',
  '.user-header__actions',
  '.user-header__favourite',
  '.loading',
  '.no-results',
  '.tooltip',
  '.global-footer',
  '#all-tags-header',
  '.site-section--tags > h2',
  '#main form label',
  '#main form legend',
  '#main form button',
  '#main form select option',
  '.site-section--importer',
  '.site-section--import',
  '.site-section--faq h2',
  '.site-section--faq h3',
  '.site-section--account',
  // Account settings (ads, password): card titles and the status / button row, not the note
  '.site-section--settings .card__header',
  '.site-section--settings .settings__row',
  '.site-section--settings .settings__note',
  '#main form .form__hint',
  '.site-section--login',
  '.site-section--register',
  // Plain text pages without a section class (the importer's session key tutorial)
  'div#page.page',
  '#file-search',
  // The creators search form starts with a modifier class instead of .search-form
  '#search-form',
  // Home page welcome text and the contact page body (plain divs inside their sections)
  '.jumbo-welcome-description',
  '.site-section--contact',
  // Creator links tab: "Link another account"
  '#add-new-link',
  // Empty lists: runtime "no artists" line and the no-results card
  '.card-list__item--no-results',
  '.card--no-results',
  '.card-list__items > .subtitle',
  // "previews only" badge on creator cards (its title)
  '.state-badge',
  // Favourites: Type / Sort by / Order dropdowns outside a form
  '.dropdowns',
  // DMs: card dates, the review page (status filter, approve labels, redaction controls, empty text)
  '.dm-card__footer',
  'select#status',
  'label[for="status"]',
  '.no-dms',
  '.dms__approve',
  '[data-redact-toggle]',
  '[data-redact-status]',
  '[data-redact-reset]',
  '.dms__redact-bubble',
  // Account pages with their own section modifiers
  '.site-section--account-keys',
  '.site-section--account-notifications .notifications__list',
  // Server messages (login/register errors) and the bare error/success pages
  '.flash_messages',
  '#main > .subtitle',
  // Upload form: hints under the fields and the add-files button
  '.site-section--upload small',
  '#upload-button',
];

/** Never translated, even inside a scope: user content and our own interface. */
export const SITE_SKIP = [
  '.post-card__header',
  '.post__title',
  '.post__content',
  '.post__user-name',
  '.user-header__name',
  '.comment',
  '.post__comments',
  // DM cards: the sender and the message (the footer with the dates is chrome)
  '.dm-card__header',
  '.dm-card__body',
  '.dm-card__content',
  '#tag-container',
  '.post__tags',
  '#post-tags a',
  'time',
  '.timestamp',
  '.search-syntax__example',
  'script',
  'style',
  'textarea',
  'code',
  'pre',
  '[contenteditable]',
  '[data-kdl-no-translate]',
  '.kdl-scope',
  '[id^="kdl-"]',
  '[class^="kdl-"]',
].join(', ');

const ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

interface Change {
  original: string;
  applied: string;
}

const textChanges = new Map<Text, Change>();
const attrChanges = new Map<Element, Map<string, Change>>();

/** Element text as the site wrote it, undoing our translation (for code that reads site headings). */
export function originalText(element: Element | null | undefined): string {
  if (!element) return '';
  let text = '';
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const change = textChanges.get(node);
    text += change && node.data === change.applied ? change.original : node.data;
  }
  return text;
}

function translateText(node: Text): void {
  const known = textChanges.get(node);
  if (known && node.data === known.applied) return;
  // The site rewrote a node we had translated: its new text is the new original
  const source = node.data;
  if (!source.trim()) return;
  const translated = translateSiteText(source);
  if (translated === null) {
    textChanges.delete(node);
    return;
  }
  const lead = /^\s*/.exec(source)![0];
  const trail = /\s*$/.exec(source)![0];
  const applied = lead + translated + trail;
  if (applied === source) return;
  // An option without a value submits its text: pin the English value so filters keep working
  const option = node.parentElement;
  if (option instanceof HTMLOptionElement && !option.hasAttribute('value')) option.setAttribute('value', option.value);
  textChanges.set(node, { original: source, applied });
  node.data = applied;
}

// Submit and button inputs show their value attribute as the label
const LABEL_INPUT = 'input[type="submit"], input[type="button"], input[type="reset"]';

function translateAttributes(element: Element): void {
  const names: readonly string[] = element.matches(LABEL_INPUT) ? [...ATTRIBUTES, 'value'] : ATTRIBUTES;
  names.forEach((name) => {
    const value = element.getAttribute(name);
    if (!value) return;
    const changes = attrChanges.get(element);
    const known = changes?.get(name);
    if (known && value === known.applied) return;
    const translated = translateSiteText(value);
    if (translated === null || translated === value) return;
    const map = changes ?? new Map<string, Change>();
    map.set(name, { original: value, applied: translated });
    attrChanges.set(element, map);
    element.setAttribute(name, translated);
  });
}

function translateScope(scope: Element): void {
  if (scope.closest(SITE_SKIP)) return;
  translateAttributes(scope);
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node instanceof Element && node.matches(SITE_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else translateAttributes(node as Element);
  }
}

/** Forgets nodes the page has dropped, so the maps do not grow across navigations. */
function prune(): void {
  textChanges.forEach((_, node) => !node.isConnected && textChanges.delete(node));
  attrChanges.forEach((_, element) => !element.isConnected && attrChanges.delete(element));
}

export function translateSite(): void {
  if (getLanguage() === 'en') return;
  prune();
  document.querySelectorAll(SITE_SCOPES.join(', ')).forEach(translateScope);
}

/** Puts back every original text and attribute we replaced. */
export function restoreSite(): void {
  textChanges.forEach((change, node) => {
    if (node.data === change.applied) node.data = change.original;
  });
  textChanges.clear();
  attrChanges.forEach((changes, element) => {
    changes.forEach((change, name) => {
      if (element.getAttribute(name) === change.applied) element.setAttribute(name, change.original);
    });
  });
  attrChanges.clear();
}

let mounted = false;
const SCOPE_SELECTOR = () => SITE_SCOPES.join(', ');

/** Translates the site chrome inside freshly added nodes: the scope around them, or scopes inside them.
    A batch can carry tens of thousands of nodes (the 2000-tag cloud being parsed, or re-sorted): every element
    is matched against the selectors once per batch, and a subtree is searched once, not once per added node. */
function translateAdded(mutations: MutationRecord[]): void {
  if (getLanguage() === 'en') return;
  const scopes = new Set<Element>();
  const selector = SCOPE_SELECTOR();
  // Inside user content or our own interface: translateScope would turn every scope there down anyway
  const skipped = new Map<Element, boolean>();
  const isSkipped = (element: Element | null): boolean => {
    if (!element) return false;
    let known = skipped.get(element);
    if (known === undefined) {
      known = element.matches(SITE_SKIP) || isSkipped(element.parentElement);
      skipped.set(element, known);
    }
    return known;
  };
  // The same answer as element.closest(selector), shared by everything under one parent
  const around = new Map<Element, Element | null>();
  const scopeOf = (element: Element | null): Element | null => {
    if (!element) return null;
    let known = around.get(element);
    if (known === undefined) {
      known = element.matches(selector) ? element : scopeOf(element.parentElement);
      around.set(element, known);
    }
    return known;
  };
  const searched = new Set<Element>();
  const inSearched = (element: Element): boolean => {
    for (let up = element.parentElement; up; up = up.parentElement) if (searched.has(up)) return true;
    return false;
  };
  const seen = new Set<Node>();
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      const isElement = node instanceof Element;
      const element = isElement ? node : node.parentElement;
      if (!element || seen.has(node)) return;
      seen.add(node);
      if (!element.isConnected || isSkipped(element)) return;
      const scope = scopeOf(element);
      if (scope) scopes.add(scope);
      // Only an added element can bring scopes with it (a text node's parent was looked at when it came)
      else if (isElement && element.firstElementChild && !inSearched(element)) {
        searched.add(element);
        element.querySelectorAll(selector).forEach((found) => scopes.add(found));
      }
    });
  }
  scopes.forEach(translateScope);
}

// Runs in the same task as the change (htmx swaps, history restores, the site's own renders), so new text is
// translated before the browser paints it, instead of flashing in English until the router's next update
let observer: MutationObserver | null = null;

export const siteTranslationModule: KdlModule = {
  id: 'i18n.site',
  name: 'Translate the site',
  description: "Shows the site's menus, headings, buttons and pagination in the interface language. Posts, comments, names and tags stay as written.",
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  // After the modules that read or wrap site headings, so they see the page first
  after: ['kui.post', 'downloader.post', 'downloader.creator'],
  setup() {
    onLanguageChange(() => {
      if (!mounted) return;
      restoreSite();
      translateSite();
    });
  },
  // Translates the chrome while the page is still being parsed, so a new tab never shows the English menus
  early() {
    if (getLanguage() === 'en' || observer) return;
    observer = new MutationObserver(translateAdded);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  },
  mount(ctx) {
    mounted = true;
    observer?.disconnect();
    translateSite();
    observer = new MutationObserver(translateAdded);
    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onCleanup(() => {
      observer?.disconnect();
      observer = null;
    });
  },
  update: translateSite,
  unmount() {
    mounted = false;
    restoreSite();
  },
  // The snapshot is cloned synchronously right after this hook: put the translation back in a microtask, before
  // the next paint, so the sidebar (which the swap keeps) never shows English
  beforeSnapshot() {
    restoreSite();
    queueMicrotask(() => mounted && translateSite());
  },
};
