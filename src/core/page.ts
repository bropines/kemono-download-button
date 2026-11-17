import { PageInfo, PageType, SiteId } from './types';

export function detectSite(hostname = window.location.hostname): SiteId {
  if (hostname.includes('coomer')) return 'coomer';
  if (hostname.includes('pawchive')) return 'pawchive';
  return 'kemono';
}

// Same URL shapes on all three sites: /{service}/user/{id}[/post/{postId}], /posts, /artists
export function pageFromUrl(path: string): PageType {
  if (path.includes('/post/')) return 'post';
  if (path.includes('/user/')) return 'creator';
  if (path === '/' || path.startsWith('/posts')) return 'list';
  if (path.startsWith('/artists') || path.startsWith('/creators')) return 'artists';
  if (path.startsWith('/search')) return 'search';
  return 'other';
}

// Only consulted when the URL says nothing; kemono.cr renders late, so this can flip from 'other' later
export function pageFromDom(): PageType {
  if (document.querySelector('div.post__body, .post__header')) return 'post';
  if (document.querySelector('h1.user-header__name')) return 'creator';
  if (document.querySelector('a.user-card')) return 'artists';
  if (document.querySelector('article.post-card')) return 'list';
  return 'other';
}

export function detectPage(): PageInfo {
  const path = window.location.pathname;
  const fromUrl = pageFromUrl(path);
  return { type: fromUrl === 'other' ? pageFromDom() : fromUrl, site: detectSite(), path };
}

export function writePageAttributes(page: PageInfo): void {
  const html = document.documentElement;
  html.setAttribute('data-kdl-page', page.type);
  html.setAttribute('data-kdl-site', page.site);
}

export function resolveRoot(): Element {
  return document.querySelector('main#main') || document.getElementById('main') || document.body || document.documentElement;
}

// Pawchive's own script marks the <head> styles present at DOMContentLoaded with data-keep and removes every
// other <style>/<script> in <head> on htmx:beforeSwap. Ours come later, so without the mark each navigation
// dropped them until the next reconcile put them back: the site flashed its own look in between.
const KEEP_ATTR = 'data-keep';
const OWN_HEAD_NODES = 'style[id^="kdl-"], style[id^="kui-"], link[id^="kdl-"]';

/** Exempts one of our <head> nodes from the site's per-navigation cleanup */
export function keepInHead<T extends Element>(node: T): T {
  node.setAttribute(KEEP_ATTR, '');
  return node;
}

/** Marks every style of ours in <head>, including ones a host's GM_addStyle created */
export function keepOwnHeadNodes(): void {
  document.querySelectorAll(OWN_HEAD_NODES).forEach((node) => {
    if (!node.hasAttribute(KEEP_ATTR)) keepInHead(node);
  });
}
