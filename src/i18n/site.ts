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
  mount() {
    mounted = true;
    translateSite();
  },
  update: translateSite,
  unmount() {
    mounted = false;
    restoreSite();
  },
  beforeSnapshot: restoreSite,
};
