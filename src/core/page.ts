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
