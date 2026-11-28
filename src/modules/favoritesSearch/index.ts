// Search on the favourites page (/favorites, creators or posts): the site lists 50 a page with no way to look
// one up. A box next to its sort selects searches the whole list, read once from the account favourites API
// (same origin, the browser's own login), and shows the matches as the site's own cards in place of the page's
// cards and paginators. Clearing the box (or Esc) puts the page back; so do unmount and every htmx snapshot.

import type { KdlModule } from '../../core/types';
import { el } from '../../utils/dom';
import { getApiUrl } from '../../utils/helpers';
import { ensureKit, input, kitScope } from '../../ui/kit';
import { t } from '../../i18n';
import { buildCard } from '../postsSearch';

const SECTION = '.site-section--favorites';
const MARK = 'data-kdl-favsearch';
const HIDE_ATTR = 'data-kdl-favsearch-hidden';
const MAX_SHOWN = 200;

const SERVICE_NAMES: Record<string, string> = {
  patreon: 'Patreon',
  fanbox: 'Pixiv Fanbox',
  fantia: 'Fantia',
  gumroad: 'Gumroad',
  subscribestar: 'SubscribeStar',
  dlsite: 'DLsite',
  discord: 'Discord',
  boosty: 'Boosty',
  afdian: 'Afdian',
  onlyfans: 'OnlyFans',
  fansly: 'Fansly',
  candfans: 'CandFans',
};

type Kind = 'artist' | 'post';
const lists = new Map<Kind, Promise<any[]>>();
let timer: ReturnType<typeof setTimeout> | undefined;
let lastQuery = '';

function kindOfPage(): Kind {
  return new URLSearchParams(window.location.search).get('type') === 'post' ? 'post' : 'artist';
}

function loadList(kind: Kind): Promise<any[]> {
  let found = lists.get(kind);
  if (!found) {
    found = fetch(getApiUrl(`/api/v1/account/favorites?type=${kind}`), { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = JSON.parse(await response.text());
        return Array.isArray(data) ? data : [];
      });
    // A failed read is asked again on the next search
    found.catch(() => lists.delete(kind));
    lists.set(kind, found);
  }
  return found;
}

const fold = (text: unknown): string => String(text ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

function matches(item: any, kind: Kind, words: string[]): boolean {
  const hay = kind === 'artist'
    ? fold(`${item.name} ${item.id} ${item.service} ${SERVICE_NAMES[item.service] || ''}`)
    : fold(`${item.title} ${item.id} ${item.user} ${item.service}`);
  return words.every((word) => hay.includes(word));
}

/** The site's creator card markup (as /artists draws it), so the skin and the quick-favourite star apply */
function creatorCard(item: any): HTMLElement {
  const service = String(item.service || '');
  const id = String(item.id || '');
  const card = el('a', { className: 'user-card', href: `/${service}/user/${id}` }, [
    el('div', { className: 'user-card__icon' }, [
      el('span', { className: 'fancy-image user-card__user-icon' }, [
        el('picture', { className: 'fancy-image__picture' }, [el('img', { className: 'fancy-image__image', src: `/icons/${service}/${id}`, alt: '', loading: 'lazy' })]),
      ]),
    ]),
    el('div', { className: 'user-card__info' }, [
      el('span', { className: 'user-card__service' }, [SERVICE_NAMES[service] || service]),
      el('div', { className: 'user-card__name' }, [String(item.name || id)]),
    ]),
  ]);
  card.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url("/banners/${service}/${id}")`;
  return card;
}

function siteParts(section: Element): HTMLElement[] {
  return Array.from(section.querySelectorAll<HTMLElement>(`:scope > .card-list:not([${MARK}]), :scope .paginator, :scope > .no-results`));
}

function showSite(section: Element): void {
  section.querySelectorAll(`[${MARK}="results"]`).forEach((node) => node.remove());
  section.querySelectorAll(`[${HIDE_ATTR}]`).forEach((node) => node.removeAttribute(HIDE_ATTR));
}

function status(section: Element, text: string): void {
  const line = section.querySelector<HTMLElement>(`[${MARK}="status"]`);
  if (line) {
    line.textContent = text;
    line.hidden = !text;
  }
}

async function search(section: Element, query: string): Promise<void> {
  lastQuery = query;
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) {
    showSite(section);
    status(section, '');
    return;
  }
  const kind = kindOfPage();
  status(section, t('favsearch.loading'));
  let list: any[];
  try {
    list = await loadList(kind);
  } catch {
    if (lastQuery === query) status(section, t('favsearch.failed'));
    return;
  }
  // A newer search, or the box was cleared, while the list loaded
  if (lastQuery !== query || !section.isConnected) return;
  const found = list.filter((item) => matches(item, kind, words));
  siteParts(section).forEach((node) => node.setAttribute(HIDE_ATTR, ''));
  section.querySelectorAll(`[${MARK}="results"]`).forEach((node) => node.remove());
  const items = el('div', { className: 'card-list__items' }, found.slice(0, MAX_SHOWN).map((item) => (kind === 'artist' ? creatorCard(item) : buildCard(item))));
  const results = el('div', { className: `card-list card-list--legacy kdl-favsearch-results` }, [el('div', { className: 'card-list__layout' }), items]);
  results.setAttribute(MARK, 'results');
  const anchor = section.querySelector(`[${MARK}="box"]`);
  anchor?.after(results);
  status(section, found.length
    ? t('favsearch.found', { n: found.length, total: list.length }) + (found.length > MAX_SHOWN ? ' ' + t('favsearch.capped', { n: MAX_SHOWN }) : '')
    : t('favsearch.none', { total: list.length }));
}

function install(): void {
  const section = document.querySelector(SECTION);
  if (!section || section.querySelector(`[${MARK}="box"]`)) return;
  // Logged out the page has nothing to search
  if (!section.querySelector('.card-list, form.dropdowns')) return;
  ensureKit();
  const box = input({ type: 'search', placeholder: t('favsearch.placeholder'), ariaLabel: t('favsearch.placeholder'), autocomplete: 'off' }) as HTMLInputElement;
  box.classList.add('kdl-favsearch__input');
  box.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => void search(section, box.value), 160);
  });
  box.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && box.value) {
      event.stopPropagation();
      box.value = '';
      void search(section, '');
    }
    // The site's sort form submits on Enter
    if (event.key === 'Enter') event.preventDefault();
  });
  const line = el('p', { className: 'kdl-favsearch__status' });
  line.setAttribute(MARK, 'status');
  line.hidden = true;
  const scope = kitScope([box, line], { className: 'kdl-favsearch' });
  scope.setAttribute(MARK, 'box');
  const form = section.querySelector('form.dropdowns');
  const header = section.querySelector('.site-section__header');
  if (form) form.after(scope);
  else if (header) header.after(scope);
  else section.prepend(scope);
}

function undo(): void {
  clearTimeout(timer);
  lastQuery = '';
  // The list is read again on the next visit: a star may have changed it meanwhile
  lists.clear();
  document.querySelectorAll(SECTION).forEach(showSite);
  document.querySelectorAll(`[${MARK}]`).forEach((node) => node.remove());
}

const styles = `
${SECTION} .kdl-favsearch { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 32rem; margin: 0 auto 12px; }
${SECTION} .kdl-favsearch__input { width: 100%; }
${SECTION} .kdl-favsearch__status { margin: 0; color: var(--kdl-muted-foreground); font-size: 13px; text-align: center; }
${SECTION} [${HIDE_ATTR}] { display: none !important; }
`;

export const favoritesSearchModule: KdlModule = {
  id: 'favorites.search',
  name: 'Favourites search',
  description: 'A search box on the favourites page that looks through all your favourite creators or posts, not only the page shown.',
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  styles,
  mount: install,
  update: install,
  unmount: undo,
  beforeSnapshot: undo,
};
