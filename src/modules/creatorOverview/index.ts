// Creator overview: on a creator's Posts tab, the other tabs' content in short, read from the API, so they do
// not have to be opened one by one (the tabs stay as they are):
// - the latest announcement as a small card (text only, clamped, expandable),
// - the creator's tags as a scrollable chip strip; a chip filters the posts by that tag (?tag=),
// - linked accounts as chips (avatar, name, service).
// One node of ours (.kdl-ov) placed after the similar creators strip, the skin's tabs row or the header;
// removed on unmount and before htmx snapshots.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { ensureKit, kitIcon, kitScope } from '../../ui/kit';
import { fetchAnnouncements, fetchCreatorLinks, fetchCreatorTags } from '../../api/kemonoApi';
import { t } from '../../i18n';

const OWN = 'kdl-ov';
const POSTS_TAB = /^\/([^/]+)\/user\/([^/?#]+)\/?$/;
const TAG_LIMIT = 40;

interface Who { service: string; id: string }
interface Overview { announcement: { text: string; added: string; count: number } | null; tags: { tag: string; count: number }[]; links: (Who & { name: string })[] }

const cache = new Map<string, Promise<Overview>>();
let node: HTMLElement | null = null;
let current = '';
let pending = '';
let generation = 0;

const creatorFromPath = (): Who | null => {
  const m = POSTS_TAB.exec(location.pathname);
  return m ? { service: m[1], id: decodeURIComponent(m[2]) } : null;
};

/** Announcement HTML as plain text with its line breaks (never injected as HTML) */
function plain(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p, div, li').forEach((block) => block.append('\n'));
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

async function load(who: Who, ctx: ModuleContext): Promise<Overview> {
  const want = (key: string) => ctx.settings.get<boolean>(key) !== false;
  const [ann, tags, links] = await Promise.all([
    want('announcements') ? fetchAnnouncements(who.service, who.id).catch(() => null) : null,
    want('tags') ? fetchCreatorTags(who.service, who.id).catch(() => []) : [],
    want('links') ? fetchCreatorLinks(who.service, who.id).catch(() => null) : null,
  ]);
  const annList = Array.isArray(ann) ? ann.filter((a: any) => a && typeof a.content === 'string') : [];
  const latest = annList[0];
  return {
    announcement: latest ? { text: plain(latest.content), added: String(latest.added || latest.published || '').slice(0, 10), count: annList.length } : null,
    tags: tags.slice(0, TAG_LIMIT),
    links: (Array.isArray(links) ? links : [])
      .filter((l: any) => l && l.id && l.service && !(l.service === who.service && String(l.id) === who.id))
      .map((l: any) => ({ service: String(l.service), id: String(l.id), name: String(l.name || l.id) })),
  } as Overview;
}

function section(title: string, href: string | null, body: HTMLElement): HTMLElement {
  return el('div', { className: `${OWN}__section` }, [
    el('div', { className: `${OWN}__head` }, [
      href ? el('a', { className: `${OWN}__title`, href }, [title]) : el('span', { className: `${OWN}__title` }, [title]),
    ]),
    body,
  ]);
}

function build(who: Who, data: Overview): HTMLElement | null {
  const base = `/${who.service}/user/${who.id}`;
  const parts: HTMLElement[] = [];
  if (data.announcement) {
    const text = el('div', { className: `${OWN}__ann-text` }, [data.announcement.text]);
    const card = el('div', { className: `${OWN}__ann` }, [
      el('div', { className: `${OWN}__ann-meta` }, [kitIcon('message-square'), data.announcement.added]),
      text,
    ]);
    card.title = t('overview.expand');
    card.addEventListener('click', () => card.toggleAttribute('data-open'));
    parts.push(section(t('overview.announcements', { count: data.announcement.count }), `${base}/announcements`, card));
  }
  if (data.tags.length) {
    const active = new URLSearchParams(location.search).get('tag');
    const strip = el('div', { className: `${OWN}__scroll` }, data.tags.map(({ tag, count }) => {
      const chip = el('a', { className: `${OWN}__tag`, href: tag === active ? base : `${base}?tag=${encodeURIComponent(tag)}` }, [
        el('span', { className: `${OWN}__tag-name` }, [tag]),
        el('span', { className: `${OWN}__tag-count` }, [String(count)]),
      ]);
      if (tag === active) chip.setAttribute('aria-current', 'true');
      return chip;
    }));
    parts.push(section(t('overview.tags'), `${base}/tags`, strip));
  }
  if (data.links.length) {
    const strip = el('div', { className: `${OWN}__scroll` }, data.links.map((l) =>
      el('a', { className: `${OWN}__link`, href: `/${l.service}/user/${l.id}` }, [
        el('span', { className: `${OWN}__avatar` }, [el('img', { src: `/icons/${l.service}/${l.id}`, alt: '', loading: 'lazy' })]),
        el('span', { className: `${OWN}__link-text` }, [
          el('span', { className: `${OWN}__link-name` }, [l.name]),
          el('span', { className: `${OWN}__link-service` }, [l.service]),
        ]),
      ])));
    parts.push(section(t('overview.links'), `${base}/links`, strip));
  }
  if (!parts.length) return null;
  ensureKit();
  return kitScope(parts, { className: OWN });
}

function place(): void {
  if (!node) return;
  const where = document.querySelector('.kdl-sim') || document.querySelector('.kdl-sk-tabs-row') || document.querySelector('header.user-header');
  if (where && node.previousElementSibling !== where) where.after(node);
}

function remove(): void {
  generation++;
  node?.remove();
  node = null;
  current = '';
  pending = '';
}

async function render(ctx: ModuleContext): Promise<void> {
  const who = creatorFromPath();
  if (!who) return remove();
  const key = `${who.service}/${who.id}${location.search}`;
  if (key === current && node?.isConnected) return place();
  if (key === pending) return;
  remove();
  current = key;
  pending = key;
  const request = generation;
  const cacheKey = `${who.service}/${who.id}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, load(who, ctx));
  const data = await cache.get(cacheKey)!;
  if (request !== generation) return;
  pending = '';
  node = build(who, data);
  place();
}

const STYLES = `
.${OWN} { display: flex; flex-direction: column; gap: 10px; margin: 8px 0 12px; min-width: 0; max-width: 100%; contain: inline-size; }
.${OWN}__head { display: flex; align-items: center; margin-bottom: 6px; }
.${OWN}__title { font-size: 13px; font-weight: 600; color: var(--kdl-muted-foreground); text-decoration: none; }
a.${OWN}__title:hover { color: var(--kdl-foreground); }
.${OWN}__scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.${OWN}__tag {
  display: inline-flex; flex: 0 0 auto; align-items: center; gap: 6px; height: 1.875rem; padding: 0 10px;
  border: 1px solid var(--kdl-border); border-radius: 9999px; background: var(--kdl-card, transparent);
  color: var(--kdl-foreground); font-size: 13px; text-decoration: none; white-space: nowrap;
}
.${OWN}__tag:hover { background: var(--kdl-accent); }
.${OWN}__tag[aria-current] { border-color: var(--kdl-primary); background: color-mix(in srgb, var(--kdl-primary) 18%, transparent); }
.${OWN}__tag-count { color: var(--kdl-muted-foreground); font-size: 11px; font-variant-numeric: tabular-nums; }
.${OWN}__ann {
  padding: 10px 12px; border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius);
  background: var(--kdl-card, transparent); cursor: pointer;
}
.${OWN}__ann-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: var(--kdl-muted-foreground); font-size: 12px; }
.${OWN}__ann-meta .kdl-ui-icon { width: 14px; height: 14px; }
.${OWN}__ann-text {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  font-size: 13px; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere;
}
.${OWN}__ann[data-open] .${OWN}__ann-text { display: block; }
.${OWN}__link {
  display: flex; flex: 0 0 auto; align-items: center; gap: 8px; width: 200px; padding: 8px;
  border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-card, transparent);
  color: var(--kdl-foreground); text-decoration: none;
}
.${OWN}__link:hover { background: var(--kdl-accent); }
.${OWN}__avatar { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 9999px; background: var(--kdl-muted); overflow: hidden; }
.${OWN}__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${OWN}__link-text { display: flex; flex-direction: column; min-width: 0; }
.${OWN}__link-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
.${OWN}__link-service { font-size: 11px; color: var(--kdl-muted-foreground); }
`;

export const creatorOverviewModule: KdlModule = {
  id: 'creators.overview',
  name: 'Creator overview',
  description: "On a creator's Posts tab: the latest announcement, the creator's tags (a chip filters the posts) and linked accounts, from the API, without opening each tab.",
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  after: ['creators.similar'],
  settings: [
    { key: 'announcements', label: 'Latest announcement', type: 'boolean', default: true },
    { key: 'tags', label: 'Tags strip', type: 'boolean', default: true },
    { key: 'links', label: 'Linked accounts', type: 'boolean', default: true },
  ],
  styles: STYLES,
  mount(ctx) {
    const rerender = () => {
      cache.clear();
      remove();
      void render(ctx);
    };
    ['announcements', 'tags', 'links'].forEach((key) => ctx.settings.onChange(key, rerender));
    // The similar creators strip arrives later and goes right after the tabs, so it lands above this block
    void render(ctx);
    ctx.onCleanup(remove);
  },
  update(ctx) {
    void render(ctx);
  },
  beforeSnapshot() {
    remove();
  },
};
