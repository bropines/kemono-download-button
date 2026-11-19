// Cross-site creator links: a quiet row under the creator header with the links the community dataset
// (github.com/bropines/creator-links) knows for this creator (E-Hentai artist or group tag, Pixiv profile),
// a plain "Search E-Hentai" link and a "Suggest a link" shortcut to the prefilled issue form.
// Nothing is requested from E-Hentai or Pixiv: the chips are ordinary links the user opens themselves.
// A Fanbox creator id is also the Pixiv user id, so those get a Pixiv chip without any data.
//
// The row is a sibling after the site's header; it is removed on unmount and before htmx snapshots.

import type { KdlModule } from '../../core/types';
import { el } from '../../utils/dom';
import { button, ensureKit, kitScope } from '../../ui/kit';
import { t } from '../../i18n';
import { REPO, isStale, linksFor, refreshIndex, type CreatorLink } from './data';

const ROW_ID = 'kdl-xlinks';
const HEADER = '.site-section--user > .user-header, .user-header';

function creatorFromPath(): { service: string; id: string; path: string } | null {
  const m = /^\/([^/]+)\/user\/([^/?#]+)/.exec(window.location.pathname);
  if (!m) return null;
  let id = m[2];
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep as is
  }
  return { service: m[1], id, path: `/${m[1]}/user/${m[2]}` };
}

const tagUrl = (namespace: string, value: string): string =>
  `https://e-hentai.org/tag/${namespace}:${encodeURIComponent(value).replace(/%20/g, '+')}`;

/** Known links plus the Pixiv profile every Fanbox creator has; one chip per distinct target. */
function chipsFor(service: string, id: string): CreatorLink[] {
  const links = linksFor(service, id);
  if (service === 'fanbox' && /^[1-9][0-9]{0,11}$/.test(id) && !links.some((l) => l.site === 'pixiv' && l.value === id)) {
    links.push({ site: 'pixiv', type: '', value: id });
  }
  return links.sort((a, b) => Number(b.site === 'e-hentai') - Number(a.site === 'e-hentai'));
}

function chip(link: CreatorLink): HTMLElement {
  if (link.site === 'pixiv') {
    return button({
      href: `https://www.pixiv.net/users/${encodeURIComponent(link.value)}`,
      target: '_blank',
      variant: 'outline',
      size: 'sm',
      icon: 'link',
      label: t('xlinks.pixiv'),
      title: `pixiv.net/users/${link.value}`,
      className: 'kdl-xl__chip',
    });
  }
  const group = link.type === 'group';
  return button({
    href: tagUrl(group ? 'group' : 'artist', link.value),
    target: '_blank',
    variant: 'outline',
    size: 'sm',
    icon: 'link',
    label: t(group ? 'xlinks.ehGroup' : 'xlinks.ehArtist', { name: link.value }),
    title: `e-hentai.org ${group ? 'group' : 'artist'}:${link.value}`,
    className: 'kdl-xl__chip',
  });
}

function searchUrl(name: string): string {
  // artist:"name$" = exact tag match; quotes inside the name would end the phrase early
  const query = `artist:"${name.replace(/["$]/g, ' ').replace(/\s+/g, ' ').trim()}$"`;
  return `https://e-hentai.org/?f_search=${encodeURIComponent(query)}`;
}

function suggestUrl(creator: { service: string; id: string; path: string }, name: string): string {
  const params = new URLSearchParams({
    template: 'add-link.yml',
    title: `Add link: ${creator.service}:${creator.id}`,
    creator_url: `${window.location.origin}${creator.path}`,
    creator_name: name,
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

function build(creator: { service: string; id: string; path: string }): HTMLElement {
  const name = document.querySelector('h1.user-header__name')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const row = kitScope([], { className: 'kdl-xl' });
  row.id = ROW_ID;
  row.dataset.kdlXlKey = `${creator.service}:${creator.id}`;
  row.append(el('span', { className: 'kdl-xl__label', textContent: t('xlinks.label') }));
  chipsFor(creator.service, creator.id).forEach((link) => row.append(chip(link)));
  if (name) {
    row.append(
      button({
        href: searchUrl(name),
        target: '_blank',
        variant: 'ghost',
        size: 'sm',
        icon: 'search',
        label: t('xlinks.search'),
        title: t('xlinks.search.title'),
        className: 'kdl-xl__quiet',
      }),
    );
  }
  row.append(
    button({
      href: suggestUrl(creator, name),
      target: '_blank',
      variant: 'ghost',
      size: 'sm',
      icon: 'external-link',
      label: t('xlinks.suggest'),
      title: t('xlinks.suggest.title'),
      className: 'kdl-xl__quiet',
    }),
  );
  return row;
}

function remove(): void {
  document.getElementById(ROW_ID)?.remove();
}

function render(): void {
  const creator = creatorFromPath();
  const header = document.querySelector(HEADER);
  if (!creator || !header) return;
  const key = `${creator.service}:${creator.id}`;
  const existing = document.getElementById(ROW_ID);
  if (existing && existing.dataset.kdlXlKey === key && existing.previousElementSibling === header) return;
  ensureKit();
  const row = build(creator);
  if (existing) existing.replaceWith(row);
  else header.after(row);
}

/** Rebuilds the row after a newer index arrived (the row was drawn from the cache before) */
function rerender(): void {
  remove();
  render();
}

const STYLES = `
.kdl-xl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 8px 0; min-width: 0; }
.kdl-xl__label { color: var(--kdl-muted-foreground); font-size: 13px; margin-right: 2px; }
.kdl-xl .kdl-xl__chip { max-width: 100%; }
.kdl-xl .kdl-xl__chip > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kdl-xl .kdl-xl__quiet { color: var(--kdl-muted-foreground); }
.kdl-xl .kdl-xl__quiet:hover { color: var(--kdl-foreground); }
@media (max-width: 600px) { .kdl-xl { margin-inline: 12px; } }
`;

export const creatorLinksModule: KdlModule = {
  id: 'creators.xlinks',
  name: 'Creator links on other sites',
  description:
    'On a creator page: a row with the same creator on E-Hentai and Pixiv from a community dataset (downloaded once a day), a link to search E-Hentai, and a way to suggest a link. Nothing is requested from those sites.',
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  styles: STYLES,
  mount(ctx) {
    render();
    let alive = true;
    ctx.onCleanup(() => {
      alive = false;
      remove();
    });
    if (isStale()) void refreshIndex().then((changed) => alive && changed && rerender());
  },
  update() {
    render();
  },
  beforeSnapshot() {
    remove();
  },
};
