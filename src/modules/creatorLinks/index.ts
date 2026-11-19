// Creator on other sites: a small menu opened from the creator's name in the header (and from a link icon
// beside it). It lists:
// - the original profile the name links to (Patreon, Fanbox...),
// - known links from the community dataset (github.com/bropines/creator-links) plus the Pixiv profile every
//   Fanbox creator has (a Fanbox creator id is the Pixiv user id),
// - searches for the creator's name on other sites (E-Hentai, nhentai, Hitomi, boorus, Pixiv, the other
//   archives), editable in the module settings as "Label | URL with {name} or {tag}" lines,
// - "Suggest a link", the prefilled issue form of the dataset.
// Nothing is requested from those sites: every entry is a plain link the user opens.
// Our only node is the icon button inside the name heading; removed on unmount and before htmx snapshots.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { addKitStyles, button, ensureKit, kitIcon, kitScope, popover, type PopoverHandle } from '../../ui/kit';
import type { IconName } from '../../config/icons';
import { t } from '../../i18n';
import { REPO, isStale, linksFor, refreshIndex, type CreatorLink } from './data';

const OWN_ID = 'kdl-xlinks';
const NAME = '.user-header__name';
const PROFILE = '.user-header__profile';

// {name}: the name as typed, URL-encoded. {tag}: lower case, spaces as underscores (booru tag style).
const DEFAULT_SEARCHES = [
  'E-Hentai | https://e-hentai.org/?f_search=artist%3A%22{name}%24%22',
  'nhentai | https://nhentai.net/search/?q=artist%3A%22{name}%22',
  'Hitomi | https://hitomi.la/search.html?artist%3A{tag}',
  'Danbooru | https://danbooru.donmai.us/posts?tags={tag}',
  'Gelbooru | https://gelbooru.com/index.php?page=post&s=list&tags={tag}',
  'Rule34 | https://rule34.xxx/index.php?page=post&s=list&tags={tag}',
  'Yande.re | https://yande.re/post?tags={tag}',
  'Pixiv | https://www.pixiv.net/search_user.php?nick={name}',
  'Kemono | https://kemono.cr/artists?q={name}',
  'Coomer | https://coomer.st/artists?q={name}',
  'Pawchive | https://pawchive.pw/artists?q={name}',
].join('\n');

interface Creator { service: string; id: string; path: string }

let ctxRef: ModuleContext | null = null;
let menu: PopoverHandle | null = null;

function creatorFromPath(): Creator | null {
  const m = /^\/([^/]+)\/user\/([^/?#]+)/.exec(window.location.pathname);
  if (!m) return null;
  let id = m[2];
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep the raw segment
  }
  return { service: m[1], id, path: `/${m[1]}/user/${m[2]}` };
}

const creatorName = (): string =>
  (document.querySelector(`${NAME} [itemprop="name"]`) || document.querySelector(NAME))?.textContent?.replace(/\s+/g, ' ').trim() || '';

const tagUrl = (namespace: string, value: string): string =>
  `https://e-hentai.org/tag/${namespace}:${encodeURIComponent(value).replace(/%20/g, '+')}`;

/** Known links plus the Pixiv profile every Fanbox creator has */
function knownLinks(service: string, id: string): CreatorLink[] {
  const links = linksFor(service, id);
  if (service === 'fanbox' && /^[1-9][0-9]{0,11}$/.test(id) && !links.some((l) => l.site === 'pixiv' && l.value === id)) {
    links.push({ site: 'pixiv', type: '', value: id });
  }
  return links;
}

function suggestUrl(creator: Creator, name: string): string {
  const params = new URLSearchParams({
    template: 'add-link.yml',
    title: `Add link: ${creator.service}:${creator.id}`,
    creator_url: `${window.location.origin}${creator.path}`,
    creator_name: name,
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

/** "Label | https://...{name}..." lines; sites pointing at the current host are left out */
function searches(name: string): { label: string; url: string }[] {
  const clean = name.replace(/["$]/g, ' ').replace(/\s+/g, ' ').trim();
  const values = { name: encodeURIComponent(clean), tag: encodeURIComponent(clean.toLowerCase().replace(/ /g, '_')) };
  const source = ctxRef?.settings.get<string>('searches') || DEFAULT_SEARCHES;
  return source.split(/\r?\n/).flatMap((line) => {
    const [label, template] = line.split('|').map((part) => part.trim());
    if (!label || !template || !/^https?:\/\//i.test(template)) return [];
    try {
      if (new URL(template.replace(/\{(name|tag)\}/g, 'x')).host === location.host) return [];
    } catch {
      return [];
    }
    return [{ label, url: template.replace(/\{name\}/g, values.name).replace(/\{tag\}/g, values.tag) }];
  });
}

function item(href: string, icon: IconName, label: string): HTMLElement {
  let host = '';
  try {
    host = new URL(href, location.href).host.replace(/^www\./, '');
  } catch {
    // no host shown
  }
  return el('a', { className: 'kdl-xl__item', href, target: '_blank', rel: 'noopener noreferrer nofollow' }, [
    kitIcon(icon),
    el('span', { className: 'kdl-xl__item-label' }, [label]),
    el('span', { className: 'kdl-xl__item-host' }, [host]),
  ]);
}

const group = (title: string, items: HTMLElement[]): HTMLElement | null =>
  items.length ? el('div', { className: 'kdl-xl__group' }, [el('div', { className: 'kdl-xl__group-title' }, [title]), ...items]) : null;

function content(creator: Creator): HTMLElement {
  const name = creatorName();
  const profile = document.querySelector<HTMLAnchorElement>(PROFILE)?.href;
  const known = knownLinks(creator.service, creator.id).map((link) =>
    link.site === 'pixiv'
      ? item(`https://www.pixiv.net/users/${encodeURIComponent(link.value)}`, 'link', t('xlinks.pixiv'))
      : item(tagUrl(link.type === 'group' ? 'group' : 'artist', link.value), 'link',
        t(link.type === 'group' ? 'xlinks.ehGroup' : 'xlinks.ehArtist', { name: link.value })));
  return el('div', { className: 'kdl-xl__menu' }, [
    group(t('xlinks.profile'), profile ? [item(profile, 'external-link', creator.service.charAt(0).toUpperCase() + creator.service.slice(1))] : []),
    group(t('xlinks.known'), known),
    group(t('xlinks.searchBy', { name }), name ? searches(name).map((s) => item(s.url, 'search', s.label)) : []),
    el('div', { className: 'kdl-xl__foot' }, [
      button({ href: suggestUrl(creator, name), target: '_blank', variant: 'ghost', size: 'sm', icon: 'external-link', label: t('xlinks.suggest'), title: t('xlinks.suggest.title') }),
    ]),
  ].filter(Boolean) as HTMLElement[]);
}

function remove(): void {
  menu?.close();
  menu = null;
  document.getElementById(OWN_ID)?.remove();
}

function render(): void {
  const creator = creatorFromPath();
  const heading = document.querySelector(NAME);
  if (!creator || !heading) return remove();
  const key = `${creator.service}:${creator.id}`;
  const existing = document.getElementById(OWN_ID);
  if (existing?.dataset.kdlXlKey === key && heading.contains(existing)) return;
  remove();
  ensureKit();
  addKitStyles('kdl-xl-menu-styles', MENU_STYLES);
  const trigger = button({ icon: 'link', variant: 'ghost', size: 'icon', ariaLabel: t('xlinks.menu'), title: t('xlinks.menu'), className: 'kdl-xl__trigger' });
  menu = popover({ trigger, content: () => content(creator), ariaLabel: t('xlinks.menu'), className: 'kdl-xl__popover', align: 'start' });
  const holder = kitScope([trigger], { tag: 'span', className: 'kdl-xl' });
  holder.id = OWN_ID;
  holder.dataset.kdlXlKey = key;
  heading.append(holder);
}

/** Clicking the name opens the menu instead of leaving for the original site (Ctrl/middle click still go) */
function onNameClick(event: MouseEvent): void {
  if (!ctxRef || ctxRef.settings.get<boolean>('nameOpensMenu') === false) return;
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.(PROFILE);
  if (!link || !menu) return;
  event.preventDefault();
  menu.toggle();
}

// Page (light DOM): the trigger beside the name
const STYLES = `
.kdl-xl { display: inline-flex; vertical-align: middle; margin-left: 2px; }
.kdl-xl .kdl-xl__trigger { width: 1.75rem; height: 1.75rem; color: var(--kdl-muted-foreground); }
.kdl-xl .kdl-xl__trigger:hover { color: var(--kdl-foreground); }
`;

// Kit shadow root: the menu (popovers are portalled there)
const MENU_STYLES = `
.kdl-ui-popover.kdl-xl__popover { width: min(320px, calc(100vw - 16px)); max-height: min(70vh, 520px); overflow-y: auto; padding: 6px; }
.kdl-xl__group + .kdl-xl__group, .kdl-xl__foot { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--kdl-border); }
.kdl-xl__group-title { padding: 6px 8px 4px; color: var(--kdl-muted-foreground); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kdl-xl__item { display: flex; align-items: center; gap: 8px; height: 2rem; padding: 0 8px; border-radius: calc(var(--kdl-radius) - 2px); color: var(--kdl-foreground); font-size: 13px; text-decoration: none; }
.kdl-xl__item:hover, .kdl-xl__item:focus-visible { background: var(--kdl-accent); outline: none; }
.kdl-xl__item .kdl-ui-icon { flex: 0 0 auto; width: 14px; height: 14px; color: var(--kdl-muted-foreground); }
.kdl-xl__item-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kdl-xl__item-host { flex: 0 0 auto; color: var(--kdl-muted-foreground); font-size: 11px; }
.kdl-xl__foot { display: flex; }
.kdl-xl__foot .kdl-ui-btn { width: 100%; justify-content: flex-start; }
`;

export const creatorLinksModule: KdlModule = {
  id: 'creators.xlinks',
  name: 'Creator on other sites',
  description:
    "Clicking a creator's name (or the link icon beside it) opens a menu: the original profile, links from a community dataset (E-Hentai, Pixiv), searches for the name on other sites and a way to suggest a link. Nothing is requested from those sites.",
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  settings: [
    { key: 'nameOpensMenu', label: 'Clicking the name opens the menu', type: 'boolean', default: true, hint: 'Otherwise the name keeps going to the original site and the menu opens from the link icon. Ctrl+click always goes to the site.' },
    { key: 'searches', label: 'Search sites', type: 'textarea', default: DEFAULT_SEARCHES, hint: 'One per line: "Label | URL". {name} is the creator name, {tag} the same in lower case with underscores (booru tags).' },
  ],
  styles: STYLES,
  mount(ctx) {
    ctxRef = ctx;
    render();
    let alive = true;
    document.addEventListener('click', onNameClick, true);
    ctx.settings.onChange('searches', () => {
      remove();
      render();
    });
    ctx.onCleanup(() => {
      alive = false;
      document.removeEventListener('click', onNameClick, true);
      remove();
      ctxRef = null;
    });
    if (isStale()) void refreshIndex().then((changed) => {
      if (!alive || !changed) return;
      remove();
      render();
    });
  },
  update() {
    render();
  },
  beforeSnapshot() {
    remove();
  },
};
