// "Similar creators" strip under a creator's header (Posts tab only). Kemono/Coomer return the list from
// /api/v1/{svc}/user/{id}/recommended (with a score); Pawchive has no such API but serves the same list as the
// HTML tab /{svc}/user/{id}/recommended, whose creator cards are read instead (also the fallback when the API
// fails). Requested at document start (the URL names the creator), kept in the creator overview cache for 48h,
// and holding the page cloak briefly so it is there in the first frame; a failure renders nothing. One node of ours (.kdl-sim) after the skin's tabs row or the header; removed on unmount and
// before htmx snapshots.

import type { KdlModule, ModuleContext } from '../../core/types';
import { getApiAdapter } from '../../api';
import { appState, getSettings } from '../../state/store';
import { readStored, writeStored } from '../../state/gmStorage';
import { gmXmlhttpRequestWithRetries, isAbortError } from '../../utils/http';
import { getApiUrl } from '../../utils/helpers';
import { el } from '../../utils/dom';
import { button, ensureKit, kitIcon, kitScope } from '../../ui/kit';
import { t } from '../../i18n';
import { cachedCreatorOverview } from '../../api/creatorOverviewCache';
import { holdCloak } from '../../core/cloak';

const OWN = 'kdl-sim';
const COLLAPSED_KEY = 'mod.creators.similar.collapsed';
const POSTS_TAB = /^\/([^/]+)\/user\/([^/?#]+)\/?$/;

interface Similar {
  service: string;
  id: string;
  name: string;
  /** Service as the site prints it (HTML source only) */
  label?: string;
  score?: number;
}

const cache = new Map<string, Promise<Similar[]>>();
let aborter: AbortController | null = null;
let strip: HTMLElement | null = null;
// The creator this module already started (or finished) loading for; empty after unmount / snapshot
let current = '';

function creatorFromPath(): { service: string; id: string } | null {
  const match = POSTS_TAB.exec(location.pathname);
  return match ? { service: match[1], id: decodeURIComponent(match[2]) } : null;
}

function fromApi(data: unknown): Similar[] {
  const list = Array.isArray(data) ? data : (data as { recommended?: unknown[] } | null)?.recommended;
  if (!Array.isArray(list)) return [];
  return list
    .filter((row: any) => row && row.id && row.service)
    .map((row: any) => ({
      service: String(row.service),
      id: String(row.id),
      name: String(row.name || row.id),
      score: typeof row.score === 'number' ? row.score : typeof row.relation_score === 'number' ? row.relation_score : undefined,
    }));
}

function fromHtml(html: string): Similar[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll<HTMLAnchorElement>('a.user-card[data-id][data-service]')).map((card) => ({
    service: card.dataset.service || '',
    id: card.dataset.id || '',
    name: card.querySelector('.user-card__name')?.textContent?.trim() || card.dataset.id || '',
    label: card.querySelector('.user-card__service')?.textContent?.trim() || undefined,
  }));
}

async function load(service: string, id: string, signal?: AbortSignal): Promise<Similar[]> {
  const base = `/${service}/user/${id}/recommended`;
  const html = async () =>
    fromHtml((await gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl(base), timeout: 20000, signal })).responseText || '');
  if (getApiAdapter().name === 'pawchive') return html();
  try {
    const response = await gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl(`/api/v1${base}`), responseType: 'json', timeout: 20000, signal });
    return fromApi(response.response);
  } catch (error) {
    if (isAbortError(error)) throw error;
    return html();
  }
}

/** One shared request per creator; without a signal (the document-start prefetch) it is never aborted */
function fetchSimilar(service: string, id: string, signal?: AbortSignal): Promise<Similar[]> {
  const key = `${service}/${id}`;
  let request = cache.get(key);
  if (!request) {
    request = cachedCreatorOverview('similar', service, id, () => load(service, id, signal)).catch((error) => {
      cache.delete(key); // an aborted or failed request is not remembered
      throw error;
    });
    cache.set(key, request);
  }
  return request;
}

const serviceName = (item: Similar): string => item.label || item.service.charAt(0).toUpperCase() + item.service.slice(1);

function scoreText(score: number, max: number): string {
  const value = max <= 1 ? `${Math.round(score * 100)}%` : String(Math.round(score * 100) / 100);
  return t('similar.score', { value });
}

function star(item: Similar): HTMLElement {
  const key = `${item.service}-${item.id}`;
  const node = button({ icon: 'star', variant: 'ghost', size: 'icon', ariaLabel: t('dl.card.toggleFavorite'), title: t('dl.card.toggleFavorite'), className: `${OWN}__fav` });
  const sync = () => node.classList.toggle(`${OWN}__fav--on`, appState.favoritedArtists.has(key));
  sync();
  node.addEventListener('click', (event) => {
    event.preventDefault();
    void getApiAdapter().toggleFavorite(node, 'creator', item.service, item.id, null, sync).then(sync);
  });
  return node;
}

function chip(item: Similar, max: number): HTMLElement {
  const img = el('img', { src: `/icons/${item.service}/${item.id}`, alt: '', loading: 'lazy' }) as HTMLImageElement;
  img.addEventListener('error', () => img.remove(), { once: true });
  const text = el('span', { className: `${OWN}__text` }, [
    el('span', { className: `${OWN}__name` }, [item.name]),
    el('span', { className: `${OWN}__service` }, [serviceName(item)]),
  ]);
  const link = el('a', { className: `${OWN}__link`, href: `/${item.service}/user/${item.id}` }, [el('span', { className: `${OWN}__avatar` }, [img]), text]);
  const node = el('div', { className: `${OWN}__chip` }, [link]);
  if (typeof item.score === 'number' && max > 0) {
    const fill = el('span');
    fill.style.width = `${Math.max(4, Math.round((item.score / max) * 100))}%`;
    text.append(el('span', { className: `${OWN}__bar` }, [fill]));
    node.title = scoreText(item.score, max);
  }
  return node;
}

function anchor(): Element | null {
  return document.querySelector('.kdl-sk-tabs-row') || document.querySelector('header.user-header');
}

function place(): void {
  const where = anchor();
  if (!strip || !where) return;
  if (strip.isConnected && strip.parentElement === where.parentElement && (where.compareDocumentPosition(strip) & 4)) return;
  where.after(strip);
  document.dispatchEvent(new Event('kdl:creator-sections-changed'));
}

function remove(): void {
  const wasConnected = strip?.isConnected;
  strip?.remove();
  strip = null;
  if (wasConnected) document.dispatchEvent(new Event('kdl:creator-sections-changed'));
}

function build(items: Similar[], limit: number, favourites: Promise<unknown>): HTMLElement {
  ensureKit();
  const shown = items.slice(0, limit);
  const max = Math.max(0, ...shown.map((item) => item.score ?? 0));
  const chips = shown.map((item) => chip(item, max));
  const body = el('div', { className: `${OWN}__scroll` }, chips);
  // Stars only for a signed-in user; the strip does not wait for the favourites to arrive
  void favourites.then((signedIn) => {
    if (signedIn) chips.forEach((node, index) => node.isConnected && !node.querySelector(`.${OWN}__fav`) && node.append(star(shown[index])));
  });
  const root = kitScope([], { className: OWN });
  const toggle = button({ variant: 'ghost', size: 'icon' });
  const apply = (collapsed: boolean) => {
    root.toggleAttribute('data-collapsed', collapsed);
    toggle.replaceChildren(kitIcon(collapsed ? 'chevron-down' : 'chevron-up'));
    const label = t(collapsed ? 'similar.expand' : 'similar.collapse');
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = label;
  };
  toggle.addEventListener('click', () => {
    const next = !root.hasAttribute('data-collapsed');
    writeStored(COLLAPSED_KEY, next);
    apply(next);
  });
  const head = el('div', { className: `${OWN}__head` }, [
    el('span', { className: `${OWN}__title` }, [t('similar.title')]),
    toggle,
  ]);
  root.append(head, body);
  apply(!!readStored<boolean>(COLLAPSED_KEY, false));
  return root;
}

async function start(ctx: ModuleContext): Promise<void> {
  const who = creatorFromPath();
  if (!who) return;
  const key = `${who.service}/${who.id}`;
  if (current === key) return place();
  remove();
  current = key;
  aborter?.abort();
  const controller = (aborter = new AbortController());
  try {
    const items = (await fetchSimilar(who.service, who.id, controller.signal)).filter((item) => !(item.service === who.service && item.id === who.id));
    if (controller.signal.aborted || !items.length || !anchor()) return;
    // Favourites only when there is a strip to star; they fail quietly without a session
    const favourites = getApiAdapter().fetchUserFavorites().catch(() => false);
    strip = build(items, ctx.settings.get<number>('limit') || 12, favourites);
    place();
  } catch (error) {
    if (!isAbortError(error)) ctx.log('similar creators failed', error);
  }
}

function run(ctx: ModuleContext): void {
  holdCloak(start(ctx));
}

const STYLES = `
/* contain: the strip's width never feeds the page's: twelve 200px chips used to push the whole layout sideways */
.${OWN} { margin: 8px 0 12px; min-width: 0; max-width: 100%; contain: inline-size; }
.${OWN}[data-collapsed] .${OWN}__scroll { display: none; }
.${OWN}__head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.${OWN}__title { margin-right: auto; font-size: 13px; font-weight: 600; color: var(--kdl-muted-foreground); }
.${OWN}__scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.${OWN}__chip {
  position: relative; flex: 0 0 auto; width: 200px;
  border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius);
  background: var(--kdl-card, transparent); color: var(--kdl-foreground);
}
.${OWN}__chip { transition: background-color 0.15s ease, border-color 0.15s ease; }
.${OWN}__chip:hover { background: var(--kdl-accent); border-color: var(--kdl-hover-ring); }
.${OWN}__chip:focus-within { border-color: var(--kdl-hover-ring); }
.${OWN}__link:focus-visible { border-radius: var(--kdl-radius); outline: 2px solid var(--kdl-ring); outline-offset: -2px; }
.${OWN}__link { display: flex; align-items: center; gap: 8px; padding: 8px 36px 8px 8px; color: inherit; text-decoration: none; }
.${OWN}__avatar { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 9999px; background: var(--kdl-muted); overflow: hidden; }
.${OWN}__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${OWN}__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
.${OWN}__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
.${OWN}__service { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--kdl-muted-foreground); }
.${OWN}__bar { display: block; height: 3px; border-radius: 9999px; background: var(--kdl-muted); overflow: hidden; }
.${OWN}__bar > span { display: block; height: 100%; background: var(--kdl-primary); opacity: 0.7; }
.${OWN}__fav { position: absolute; top: 4px; right: 4px; width: 28px; height: 28px; padding: 0; color: var(--kdl-muted-foreground); }
.${OWN}__fav--on { color: var(--kdl-primary); }
.${OWN}__fav--on svg { fill: currentColor; }
@media (max-width: 600px) { .${OWN}__chip { width: 168px; } }
`;

export const similarCreatorsModule: KdlModule = {
  id: 'creators.similar',
  name: 'Similar creators',
  description: "On a creator's Posts tab: a scrollable strip of similar creators (the site's recommended list) under the header.",
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  // Part of the redesign: switched off with it
  requires: ['ui.shadcn'],
  settings: [{ key: 'limit', label: 'Creators shown', type: 'number', default: 12, min: 4, max: 30 }],
  styles: STYLES,
  // The URL already names the creator: the request starts while the page is still loading
  early() {
    const who = creatorFromPath();
    if (who) void getSettings().then(() => fetchSimilar(who.service, who.id)).catch(() => undefined);
  },
  mount(ctx) {
    run(ctx);
    ctx.onCleanup(() => {
      aborter?.abort();
      aborter = null;
      remove();
      current = '';
    });
  },
  update(ctx) {
    // Idempotent: re-places the strip (the skin may lift the tabs row later) or restarts after a snapshot strip
    const who = creatorFromPath();
    if (!who) return;
    if (current === `${who.service}/${who.id}`) place();
    else run(ctx);
  },
  beforeSnapshot() {
    remove();
    current = '';
  },
};
