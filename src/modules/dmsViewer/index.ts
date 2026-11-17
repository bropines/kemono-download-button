// Direct messages (/dms, a creator's DMs tab, favourites): the site prints every message at full length, so one
// long reward post makes a card several screens tall. Here the cards become comment-like tiles in a grid: an
// avatar, the creator and service, a preview cut to a few lines with a fade, the date and a "Read" button.
// A click on a card (outside its links) opens the whole message in a side panel or a dialog, with previous /
// next, copy and links to the creator.
//
// The site's nodes are only annotated (data-kdl-dm, data-kdl-dm-long) and get two small nodes of ours (avatar,
// read button); everything is removed on unmount and before htmx snapshots.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { addKitStyles, button, dialog, ensureKit, sheet, type DialogHandle } from '../../ui/kit';
import { showMessage } from '../../ui/toast';
import { t } from '../../i18n';

const CARD = '.dm-card';
const MARK = 'data-kdl-dm';
const LONG = 'data-kdl-dm-long';
const OURS = 'kdl-dm-own';
const LINES: Record<string, string> = { compact: '5', normal: '9', tall: '15' };

let ctxRef: ModuleContext | null = null;
let viewer: { handle: DialogHandle; index: number; cards: HTMLElement[] } | null = null;
let snapshotTimer = 0;
let resizeObserver: ResizeObserver | null = null;

/** service and creator id from the card's creator link (/patreon/user/123) */
function creatorOf(card: HTMLElement): { href: string; service: string; id: string; name: string; remote: string; serviceLabel: string } {
  const link = card.querySelector<HTMLAnchorElement>('.dms__user-link, .dm-card__header a[href*="/user/"]');
  const href = link?.getAttribute('href') || '';
  const match = /\/([^/]+)\/user\/([^/?#]+)/.exec(href);
  const remote = card.querySelector<HTMLAnchorElement>('.dms__remote-user-link')?.href || '';
  const serviceLabel = (card.querySelector('.dm-card__service')?.textContent || '').replace(/[()]/g, '').trim();
  return {
    href,
    service: match?.[1] || '',
    id: match?.[2] || '',
    name: card.querySelector('.dm-card__user')?.textContent?.trim() || link?.textContent?.trim() || '',
    remote,
    serviceLabel,
  };
}

// The footer's own text, without our Read button
function dateOf(card: HTMLElement): string {
  const node = card.querySelector('.dm-card__added, .dm-card__footer time') || card.querySelector('.dm-card__footer');
  if (!node) return '';
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(`.${OURS}`).forEach((own) => own.remove());
  return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

function avatar(service: string, id: string, className: string): HTMLElement {
  const box = el('span', { className });
  if (service && id) {
    const img = el('img', { src: `/icons/${service}/${id}`, alt: '', loading: 'lazy' }) as HTMLImageElement;
    img.addEventListener('error', () => img.remove(), { once: true });
    box.append(img);
  }
  return box;
}

function measure(card: HTMLElement): void {
  const body = card.querySelector<HTMLElement>('.dm-card__body');
  if (!body) return;
  const long = body.scrollHeight > body.clientHeight + 4;
  if (card.hasAttribute(LONG) !== long) card.toggleAttribute(LONG, long);
}

function enhance(): void {
  document.querySelectorAll<HTMLElement>(`${CARD}:not([${MARK}])`).forEach((card) => {
    card.setAttribute(MARK, '');
    const { service, id } = creatorOf(card);
    const header = card.querySelector('.dm-card__header');
    header?.prepend(avatar(service, id, `${OURS} kdl-dm-avatar`));
    const footer = card.querySelector('.dm-card__footer') || card;
    const read = el('button', { type: 'button', className: `${OURS} kdl-dm-read` }, [t('dms.read')]);
    footer.append(read);
    resizeObserver?.observe(card);
    measure(card);
  });
}

function undo(): void {
  if (viewer?.handle.isOpen()) viewer.handle.close();
  document.querySelectorAll(`.${OURS}`).forEach((node) => node.remove());
  document.querySelectorAll(`[${MARK}]`).forEach((card) => {
    card.removeAttribute(MARK);
    card.removeAttribute(LONG);
  });
  resizeObserver?.disconnect();
}

function copyText(text: string): void {
  if (typeof GM_setClipboard === 'function') GM_setClipboard(text);
  else void navigator.clipboard?.writeText(text);
  showMessage(t('dms.copied'), 'success');
}

/** Message text with line breaks kept (paragraphs and <br>) */
function plainText(content: HTMLElement): string {
  const copy = content.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  copy.querySelectorAll('p, li, div').forEach((block) => block.append('\n\n'));
  return (copy.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

function render(): void {
  if (!viewer) return;
  const { handle, cards, index } = viewer;
  const card = cards[index];
  if (!card) return;
  const who = creatorOf(card);
  const content = card.querySelector<HTMLElement>('.dm-card__content');
  const title = handle.element.querySelector('.kdl-ui-dialog__title');
  if (title) title.textContent = who.name || t('dms.message');

  const meta = el('div', { className: 'kdl-dmv__meta' }, [
    avatar(who.service, who.id, 'kdl-dmv__avatar'),
    el('div', { className: 'kdl-dmv__who' }, [
      el('div', { className: 'kdl-dmv__name' }, [who.name]),
      el('div', { className: 'kdl-dmv__sub' }, [[who.serviceLabel, dateOf(card)].filter(Boolean).join(' · ')]),
    ]),
  ]);
  const links = el('div', { className: 'kdl-dmv__links' }, [
    who.href ? button({ href: who.href, label: t('dms.creator'), icon: 'external-link', variant: 'outline', size: 'sm' }) : null,
    who.remote ? button({ href: who.remote, target: '_blank', label: who.serviceLabel || t('dms.original'), icon: 'link', variant: 'ghost', size: 'sm' }) : null,
  ]);
  const text = el('div', { className: 'kdl-dmv__content' });
  if (content) {
    text.append(...Array.from(content.cloneNode(true).childNodes));
    text.querySelectorAll('a[href]').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer nofollow');
    });
  }
  handle.body.replaceChildren(meta, links, text);
  handle.body.scrollTop = 0;

  const [prev, counter, next, copy] = Array.from(handle.footer.children) as HTMLElement[];
  (prev as HTMLButtonElement).disabled = index === 0;
  (next as HTMLButtonElement).disabled = index >= cards.length - 1;
  counter.textContent = t('dms.position', { index: index + 1, total: cards.length });
  copy.onclick = () => content && copyText(plainText(content));
  // The card behind follows, so closing lands where the reader stopped
  card.scrollIntoView({ block: 'nearest' });
}

function step(delta: number): void {
  if (!viewer) return;
  const index = viewer.index + delta;
  if (index < 0 || index >= viewer.cards.length) return;
  viewer.index = index;
  render();
}

function open(card: HTMLElement): void {
  const ctx = ctxRef;
  if (!ctx) return;
  ensureKit();
  addKitStyles('kdl-dm-viewer-styles', VIEWER_STYLES);
  const cards = Array.from(document.querySelectorAll<HTMLElement>(`${CARD}[${MARK}]`));
  const footer = [
    button({ icon: 'chevron-left', variant: 'outline', size: 'icon', ariaLabel: t('dms.prev'), title: t('dms.prev'), onClick: () => step(-1) }),
    el('span', { className: 'kdl-dmv__count' }),
    button({ icon: 'chevron-right', variant: 'outline', size: 'icon', ariaLabel: t('dms.next'), title: t('dms.next'), onClick: () => step(1) }),
    button({ icon: 'copy', label: t('dms.copy'), variant: 'secondary', size: 'sm', className: 'kdl-dmv__copy' }),
  ];
  const narrow = window.matchMedia('(max-width: 640px)').matches;
  const options = {
    title: t('dms.message'),
    footer,
    className: 'kdl-dmv',
    onClose: () => {
      window.removeEventListener('keydown', onKey, true);
      viewer = null;
    },
  };
  const handle = ctx.settings.get<string>('viewer') === 'dialog'
    ? dialog({ ...options, size: 'lg' })
    : sheet({ ...options, side: narrow ? 'bottom' : 'right' });
  viewer = { handle, cards, index: Math.max(0, cards.indexOf(card)) };
  handle.open();
  window.addEventListener('keydown', onKey, true);
  render();
}

function onKey(event: KeyboardEvent): void {
  if (!viewer || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.composedPath()[0] as HTMLElement | undefined;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' && event.shiftKey) step(-1);
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' && event.shiftKey) step(1);
  else return;
  // The site pages the list with the arrow keys too: the open message takes them
  event.preventDefault();
  event.stopImmediatePropagation();
}

function onClick(event: MouseEvent): void {
  if (event.button !== 0 || event.defaultPrevented) return;
  const target = event.target as Element | null;
  const card = target?.closest<HTMLElement>(`${CARD}[${MARK}]`);
  if (!card) return;
  // Links and a text selection keep working as usual
  if (!target?.closest('.kdl-dm-read') && target?.closest('a, button, input, select, textarea, video, audio')) return;
  if (String(window.getSelection() || '').trim()) return;
  event.preventDefault();
  open(card);
}

function onKeyOpen(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return;
  const body = (event.target as Element | null)?.closest?.('.dm-card__body');
  const card = body?.closest<HTMLElement>(`${CARD}[${MARK}]`);
  if (!card) return;
  event.preventDefault();
  open(card);
}

function syncLines(ctx: ModuleContext): void {
  const lines = LINES[ctx.settings.get<string>('preview')] || LINES.normal;
  document.documentElement.style.setProperty('--kdl-dm-lines', lines);
  document.querySelectorAll<HTMLElement>(`${CARD}[${MARK}]`).forEach(measure);
}

const STYLES = `
.card-list__items:has(> ${CARD}[${MARK}]) {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  align-items: stretch;
  gap: 12px;
  width: 100%;
  max-width: none !important;
}
.card-list:has(${CARD}[${MARK}]) { max-width: none !important; width: 100%; }
${CARD}[${MARK}] {
  display: flex !important;
  flex-direction: column;
  width: auto !important;
  max-width: none !important;
  min-width: 0;
  margin: 0 !important;
  cursor: pointer;
}
${CARD}[${MARK}] > * { padding-left: 16px !important; padding-right: 16px !important; }
${CARD}[${MARK}] .dm-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding-top: 14px !important;
  padding-bottom: 4px !important;
  border: 0 !important;
}
${CARD}[${MARK}] .dm-card__header a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
${CARD}[${MARK}] .dm-card__user { font-size: 14px; font-weight: 600; }
${CARD}[${MARK}] .dm-card__service { font-size: 12px; opacity: 0.7; }
.kdl-dm-avatar {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: var(--kdl-muted, rgba(127, 127, 127, 0.25));
  overflow: hidden;
}
.kdl-dm-avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
${CARD}[${MARK}] .dm-card__body {
  flex: 1 1 auto;
  max-height: calc(var(--kdl-dm-lines, 9) * 1.55em + 8px);
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
${CARD}[${MARK}][${LONG}] .dm-card__body {
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 3em), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 3em), transparent);
}
${CARD}[${MARK}] .dm-card__body img { max-width: 100%; height: auto; }
${CARD}[${MARK}] .dm-card__content p { margin: 0 0 0.5em; }
${CARD}[${MARK}] .dm-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px !important;
  padding-bottom: 12px !important;
  border: 0 !important;
  font-size: 12px;
  opacity: 0.85;
}
.kdl-dm-read {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid var(--kdl-border, rgba(127, 127, 127, 0.4));
  border-radius: calc(var(--kdl-radius, 8px) - 2px);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.kdl-dm-read:hover { background: var(--kdl-accent, rgba(127, 127, 127, 0.2)); }
${CARD}[${MARK}]:not([${LONG}]) .kdl-dm-read { opacity: 0.6; }
`;

// Kit shadow root: the viewer panel
const VIEWER_STYLES = `
.kdl-ui-sheet.kdl-dmv.kdl-ui-sheet--right { width: min(620px, 100vw); max-width: 620px; }
.kdl-dmv .kdl-ui-dialog__footer { justify-content: flex-start; align-items: center; }
.kdl-dmv .kdl-dmv__copy { margin-left: auto; }
.kdl-dmv__count { min-width: 5ch; font-size: 13px; color: var(--kdl-muted-foreground); text-align: center; font-variant-numeric: tabular-nums; }
.kdl-dmv__meta { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.kdl-dmv__avatar { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 9999px; background: var(--kdl-muted); overflow: hidden; }
.kdl-dmv__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.kdl-dmv__who { min-width: 0; }
.kdl-dmv__name { font-size: 15px; font-weight: 600; }
.kdl-dmv__sub { font-size: 12px; color: var(--kdl-muted-foreground); }
.kdl-dmv__links { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.kdl-dmv__content {
  padding: 14px 16px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: color-mix(in srgb, var(--kdl-muted) 45%, transparent);
  font-size: 14px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: normal;
  user-select: text;
}
.kdl-dmv__content p { margin: 0 0 0.75em; }
.kdl-dmv__content p:last-child { margin-bottom: 0; }
.kdl-dmv__content ul, .kdl-dmv__content ol { margin: 0.25em 0 0.75em; padding-left: 1.25em; }
.kdl-dmv__content a { color: var(--kdl-primary); text-decoration: underline; text-underline-offset: 2px; }
.kdl-dmv__content img, .kdl-dmv__content video { max-width: 100%; height: auto; border-radius: calc(var(--kdl-radius) - 2px); }
`;

export const dmsViewerModule: KdlModule = {
  id: 'dms.viewer',
  name: 'Messages as cards',
  description:
    'On DM pages: messages become a grid of even cards with an avatar and a short preview; a click opens the whole message in a side panel or a dialog, with previous / next and copy.',
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  settings: [
    {
      key: 'preview', label: 'Preview length', type: 'select', default: 'normal',
      options: [{ value: 'compact', label: 'Short (5 lines)' }, { value: 'normal', label: 'Medium (9 lines)' }, { value: 'tall', label: 'Long (15 lines)' }],
    },
    {
      key: 'viewer', label: 'Open messages in', type: 'select', default: 'sheet',
      options: [{ value: 'sheet', label: 'Side panel' }, { value: 'dialog', label: 'Dialog' }],
    },
  ],
  styles: STYLES,
  mount(ctx) {
    ctxRef = ctx;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver((records) => records.forEach((record) => measure(record.target as HTMLElement)));
    }
    syncLines(ctx);
    ctx.settings.onChange('preview', () => syncLines(ctx));
    enhance();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyOpen);
    ctx.onCleanup(() => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyOpen);
      clearTimeout(snapshotTimer);
      undo();
      resizeObserver = null;
      document.documentElement.style.removeProperty('--kdl-dm-lines');
      ctxRef = null;
    });
  },
  update() {
    enhance();
  },
  beforeSnapshot() {
    undo();
    snapshotTimer = window.setTimeout(enhance, 0);
  },
};
