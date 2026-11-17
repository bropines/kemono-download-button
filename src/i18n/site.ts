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
  '.site-section--login',
  '.site-section--register',
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
  '.dm-card',
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
  textChanges.set(node, { original: source, applied });
  node.data = applied;
}

function translateAttributes(element: Element): void {
  ATTRIBUTES.forEach((name) => {
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

/** Translates the site chrome inside freshly added nodes: the scope around them, or scopes inside them. */
function translateAdded(mutations: MutationRecord[]): void {
  if (getLanguage() === 'en') return;
  const scopes = new Set<Element>();
  const selector = SCOPE_SELECTOR();
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      const element = node instanceof Element ? node : node.parentElement;
      if (!element || !element.isConnected) return;
      const around = element.closest(selector);
      if (around) scopes.add(around);
      else element.querySelectorAll(selector).forEach((scope) => scopes.add(scope));
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
