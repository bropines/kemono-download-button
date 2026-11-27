// Import status page (/importer/status/<id>): the site polls the API and appends plain log lines to
// <ol class="log-list">, and writes the status as text. This module reads both and adds, on top:
// - a coloured status badge (data-state on the status cell),
// - a summary row (creators, posts added, skipped, flagged, errors),
// - each log line typed (icon, colour, indent under its creator) with post/creator links,
// - a toolbar: filter by kind, search, follow new lines, copy the log.
// The site's own nodes are only annotated; every change is undone on unmount and before htmx snapshots.

import type { KdlModule } from '../../core/types';
import { icon, type IconName } from '../../config/icons';
import { el } from '../../utils/dom';
import { button, ensureKit, input, kitScope, portal, addKitStyles, LAYERS } from '../../ui/kit';
import { getApiAdapter } from '../../api';
import { getThumbnailUrl } from '../../utils/helpers';
import { readStored, writeStored } from '../../state/gmStorage';
import { showMessage } from '../../ui/toast';
import { t } from '../../i18n';

const SECTION = '.site-section--importer-status';
const MARK = 'data-kdl-imp';
const ORIGINAL = new WeakMap<HTMLElement, string>();

type Kind = 'creator' | 'post' | 'skip' | 'done' | 'error' | 'warn' | 'info';

interface Parsed {
  kind: Kind;
  creatorId?: string;
  postId?: string;
  title?: string;
  url?: string;
  count?: number;
}

const KIND_ICON: Record<Kind, IconName> = {
  creator: 'folder',
  post: 'file',
  skip: 'refresh-cw',
  done: 'check',
  error: 'circle-x',
  warn: 'triangle-alert',
  info: 'info',
};

function parse(line: string): Parsed {
  let m = /^checking creator '(.*)' \((\w+)\)$/i.exec(line);
  if (m) return { kind: 'creator', title: m[1], creatorId: m[2] };
  m = /^post '(.*)' \((\w+)\) (added|updated)$/i.exec(line);
  if (m) return { kind: 'post', title: m[1], postId: m[2] };
  m = /^skipped (\d+) /i.exec(line);
  if (m) return { kind: 'skip', count: Number(m[1]) };
  m = /^done:\s*(https?:\/\/\S+)/i.exec(line);
  if (m) return { kind: 'done', url: m[1] };
  if (/^import complete/i.test(line)) return { kind: 'done' };
  if (/fail|error|invalid|expired|denied|forbidden|unable|could not/i.test(line)) return { kind: 'error' };
  if (/flagged|warning|retry|rate limit|too large|skipping/i.test(line)) return { kind: 'warn' };
  return { kind: 'info' };
}

function service(section: Element): string {
  const cells = Array.from(section.querySelectorAll('.import__card-grid dt'));
  const dt = cells.find((d) => /service/i.test(d.textContent || '') || /сервис/i.test(d.textContent || ''));
  return (dt?.nextElementSibling?.textContent || '').trim();
}

/** Post links need the creator: the closest "checking creator" line above */
function enhanceLines(section: Element): void {
  const list = section.querySelector<HTMLOListElement>('.log-list');
  if (!list) return;
  const svc = service(section);
  let creatorId = '';
  list.querySelectorAll<HTMLLIElement>(':scope > .log-list__item').forEach((li) => {
    const done = li.getAttribute(MARK);
    const text = done ? ORIGINAL.get(li) || '' : (li.textContent || '').trim();
    const parsed = parse(text);
    if (parsed.kind === 'creator') creatorId = parsed.creatorId || '';
    if (done) return;
    ORIGINAL.set(li, li.textContent || '');
    li.setAttribute(MARK, parsed.kind);
    if (parsed.kind === 'post' && svc && creatorId && parsed.postId) {
      li.dataset.kdlPost = parsed.postId;
      li.dataset.kdlCreator = creatorId;
      li.dataset.kdlService = svc;
      li.dataset.kdlTitle = parsed.title || '';
    }
    if (creatorId && parsed.kind !== 'creator' && parsed.kind !== 'done') li.setAttribute(`${MARK}-nested`, '');
    const body = el('span', { className: 'kdl-imp__text' });
    if (parsed.kind === 'creator' && svc) {
      body.append(t('importer.line.creator'), ' ', el('a', { href: `/${svc}/user/${parsed.creatorId}`, textContent: parsed.title || '' }));
    } else if (parsed.kind === 'post' && svc && creatorId) {
      body.append(el('a', { href: `/${svc}/user/${creatorId}/post/${parsed.postId}`, textContent: parsed.title || '' }), ' ', el('span', { className: 'kdl-imp__muted', textContent: `#${parsed.postId}` }));
    } else if (parsed.kind === 'done' && parsed.url) {
      let href = parsed.url;
      try {
        href = new URL(parsed.url).pathname; // the log names the canonical domain; stay on this mirror
      } catch {
        // keep as is
      }
      body.append(t('importer.line.done'), ' ', el('a', { href, textContent: href }));
    } else {
      body.textContent = text;
    }
    li.replaceChildren(icon(KIND_ICON[parsed.kind], 'kdl-imp__icon'), body);
    // The cards view shows the post's thumbnail here (loaded when the card scrolls into view)
    if (li.dataset.kdlPost) li.prepend(el('span', { className: 'kdl-imp__thumb' }));
  });
}

function stats(section: Element): Record<string, number> {
  const kinds = Array.from(section.querySelectorAll(`.log-list > [${MARK}]`)).map((li) => li.getAttribute(MARK));
  const lines = Array.from(section.querySelectorAll<HTMLElement>(`.log-list > [${MARK}]`)).map((li) => ORIGINAL.get(li) || '');
  const found = lines.map((l) => /found (\d+) (?:supported )?creator/i.exec(l)).find(Boolean);
  const skipped = lines.reduce((sum, l) => sum + Number(/^skipped (\d+)/i.exec(l)?.[1] || 0), 0);
  const flagged = lines.reduce((sum, l) => sum + Number(/(\d+) flagged post/i.exec(l)?.[1] || 0), 0);
  return {
    creators: found ? Number(found[1]) : kinds.filter((k) => k === 'creator').length,
    posts: kinds.filter((k) => k === 'post').length,
    skipped,
    flagged,
    errors: kinds.filter((k) => k === 'error').length,
  };
}

const STATE_BY_TEXT: [RegExp, string][] = [
  [/done|готов/i, 'done'],
  [/fail|error|ошиб/i, 'failed'],
  [/progress|процесс/i, 'running'],
  [/fetching|ожида|получ/i, 'waiting'],
];

function syncStatus(section: Element): void {
  const status = section.querySelector<HTMLElement>('.import__status');
  if (!status) return;
  const text = status.textContent || '';
  const state = STATE_BY_TEXT.find(([re]) => re.test(text))?.[1] || 'waiting';
  if (status.getAttribute(`${MARK}-state`) !== state) status.setAttribute(`${MARK}-state`, state);
}

// ---- Toolbar and summary ----

let filterKind = 'all';
let query = '';
let follow = true;
type View = 'list' | 'compact' | 'cards';
const VIEWS: View[] = ['list', 'compact', 'cards'];
let view: View = 'list';
const VIEW_KEY = 'importer.view';

function applyFilter(section: Element): void {
  const q = query.trim().toLowerCase();
  section.querySelectorAll<HTMLElement>(`.log-list > [${MARK}]`).forEach((li) => {
    const kind = li.getAttribute(MARK);
    const okKind =
      filterKind === 'all' ||
      (filterKind === 'posts' && kind === 'post') ||
      (filterKind === 'creators' && (kind === 'creator' || kind === 'done')) ||
      (filterKind === 'problems' && (kind === 'error' || kind === 'warn'));
    const okText = !q || (ORIGINAL.get(li) || '').toLowerCase().includes(q);
    li.toggleAttribute(`${MARK}-hidden`, !(okKind && okText));
  });
}

function buildTools(section: Element): HTMLElement {
  ensureKit();
  const summary = el('div', { className: 'kdl-imp__summary' });
  const kinds: [string, string][] = [
    ['all', t('importer.filter.all')],
    ['posts', t('importer.filter.posts')],
    ['creators', t('importer.filter.creators')],
    ['problems', t('importer.filter.problems')],
  ];
  const seg = el('div', { className: 'kdl-imp__seg' });
  seg.setAttribute('role', 'radiogroup');
  kinds.forEach(([value, label]) => {
    const item = el('button', { className: 'kdl-imp__seg-item', textContent: label }) as HTMLButtonElement;
    item.type = 'button';
    item.dataset.value = value;
    item.setAttribute('role', 'radio');
    item.addEventListener('click', () => {
      filterKind = value;
      refresh(section);
    });
    seg.appendChild(item);
  });
  const search = input({ type: 'search', placeholder: t('importer.search'), ariaLabel: t('importer.search') }) as HTMLInputElement;
  search.classList.add('kdl-imp__search');
  search.addEventListener('input', () => {
    query = search.value;
    applyFilter(section);
  });
  const followBtn = button({
    icon: 'eye',
    label: t('importer.follow'),
    variant: 'outline',
    size: 'sm',
    className: 'kdl-imp__follow',
    onClick: () => {
      follow = !follow;
      refresh(section);
    },
  });
  const copyBtn = button({
    icon: 'copy',
    variant: 'outline',
    size: 'icon',
    title: t('importer.copy'),
    ariaLabel: t('importer.copy'),
    className: 'kdl-imp__copy',
    onClick: () => {
      const text = Array.from(section.querySelectorAll<HTMLElement>(`.log-list > [${MARK}]`))
        .map((li) => ORIGINAL.get(li) || '')
        .join('\n');
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text);
      else void navigator.clipboard?.writeText(text);
      showMessage(t('importer.copied'), 'success');
    },
  });
  const views = el('div', { className: 'kdl-imp__seg kdl-imp__views' });
  views.setAttribute('role', 'radiogroup');
  views.setAttribute('aria-label', t('importer.view.label'));
  const viewIcons: Record<View, IconName> = { list: 'list', compact: 'scroll-text', cards: 'layout-grid' };
  VIEWS.forEach((value) => {
    const item = el('button', { className: 'kdl-imp__seg-item kdl-imp__view', title: t(`importer.view.${value}`) }) as HTMLButtonElement;
    item.type = 'button';
    item.dataset.view = value;
    item.setAttribute('role', 'radio');
    item.setAttribute('aria-label', t(`importer.view.${value}`));
    item.append(icon(viewIcons[value], 'kdl-imp__view-icon'));
    item.addEventListener('click', () => {
      view = value;
      writeStored(VIEW_KEY, value);
      hidePreview();
      refresh(section);
    });
    views.appendChild(item);
  });
  const bar = el('div', { className: 'kdl-imp__bar' }, [seg, search, el('span', { className: 'kdl-imp__spacer' }), views, followBtn, copyBtn]);
  // The site's "Reverse order" button joins the bar (it goes back on undo)
  const reverse = section.querySelector<HTMLElement>('.import__logs-head .import__reverse');
  if (reverse) {
    reverse.classList.add('kdl-imp__reverse');
    bar.insertBefore(reverse, followBtn);
  }
  const tools = kitScope([summary, bar], { className: 'kdl-imp__tools' });
  tools.setAttribute(MARK, 'tools');
  return tools;
}

function renderSummary(section: Element, tools: HTMLElement): void {
  const s = stats(section);
  const items: [string, number, string][] = [
    [t('importer.stat.creators'), s.creators, 'creators'],
    [t('importer.stat.posts'), s.posts, 'posts'],
    [t('importer.stat.skipped'), s.skipped, 'skipped'],
    [t('importer.stat.flagged'), s.flagged, 'flagged'],
    [t('importer.stat.errors'), s.errors, 'errors'],
  ];
  const summary = tools.querySelector('.kdl-imp__summary')!;
  const key = items.map((i) => i[1]).join(',');
  if ((summary as HTMLElement).dataset.key === key) return;
  (summary as HTMLElement).dataset.key = key;
  summary.replaceChildren(
    ...items.map(([label, value, id]) =>
      el('div', { className: 'kdl-imp__stat', dataset: { stat: id, zero: value ? '' : '1' } }, [
        el('span', { className: 'kdl-imp__stat-value', textContent: String(value) }),
        el('span', { className: 'kdl-imp__stat-label', textContent: label }),
      ])
    )
  );
}

function refresh(section: Element): void {
  const tools = section.querySelector<HTMLElement>(`[${MARK}="tools"]`);
  if (!tools) return;
  tools.querySelectorAll<HTMLButtonElement>('.kdl-imp__seg-item').forEach((item) => {
    const on = item.dataset.value === filterKind;
    item.toggleAttribute('data-checked', on);
    item.setAttribute('aria-checked', String(on));
  });
  tools.querySelector('.kdl-imp__follow')?.toggleAttribute('data-on', follow);
  tools.querySelectorAll<HTMLButtonElement>('.kdl-imp__view').forEach((item) => {
    const on = item.dataset.view === view;
    item.toggleAttribute('data-checked', on);
    item.setAttribute('aria-checked', String(on));
  });
  const list = section.querySelector<HTMLElement>('.log-list');
  if (list && list.getAttribute(`${MARK}-view`) !== view) list.setAttribute(`${MARK}-view`, view);
  if (view === 'cards') observeThumbs(section);
  renderSummary(section, tools);
  applyFilter(section);
}

// ---- Post thumbnails: the cards view and the hover preview ----

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;
const thumbCache = new Map<string, Promise<string | null>>();
let thumbActive = 0;
const thumbQueue: (() => void)[] = [];

// Two post requests at a time: a big import lists hundreds of posts
function throttled<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = (): void => {
      thumbActive++;
      task().then(resolve, reject).finally(() => {
        thumbActive--;
        thumbQueue.shift()?.();
      });
    };
    if (thumbActive < 2) run();
    else thumbQueue.push(run);
  });
}

function thumbFor(li: HTMLElement): Promise<string | null> {
  const { kdlService: svc, kdlCreator: creator, kdlPost: post } = li.dataset;
  if (!svc || !creator || !post) return Promise.resolve(null);
  const key = `${svc}/${creator}/${post}`;
  let found = thumbCache.get(key);
  if (!found) {
    found = throttled(async () => {
      const data = await getApiAdapter().fetchPostData(svc, creator, post);
      const p = data?.post || (Array.isArray(data) ? data[0] : data);
      const files = [p?.file, ...(Array.isArray(p?.attachments) ? p.attachments : [])].filter((file: any) => file?.path);
      const image = files.find((file: any) => IMAGE_EXT.test(file.name || file.path));
      return image ? getThumbnailUrl(image.path) : null;
    }).catch(() => null);
    thumbCache.set(key, found);
  }
  return found;
}

function noImage(slot: HTMLElement): void {
  slot.dataset.state = 'none';
  slot.replaceChildren(icon('file', 'kdl-imp__thumb-icon'));
}

function fillThumb(li: HTMLElement): void {
  const slot = li.querySelector<HTMLElement>(':scope > .kdl-imp__thumb');
  if (!slot || slot.dataset.state) return;
  slot.dataset.state = 'loading';
  void thumbFor(li).then((url) => {
    if (!url) return noImage(slot);
    const img = el('img', { src: url, alt: '' }) as HTMLImageElement;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => noImage(slot), { once: true });
    slot.dataset.state = 'ready';
    slot.replaceChildren(img);
  });
}

let thumbObserver: IntersectionObserver | null = null;
function observeThumbs(section: Element): void {
  thumbObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      thumbObserver?.unobserve(entry.target);
      fillThumb(entry.target as HTMLElement);
    });
  }, { rootMargin: '300px 0px' });
  section.querySelectorAll<HTMLElement>('.log-list > [data-kdl-post]:not([data-kdl-thumb-seen])').forEach((li) => {
    li.setAttribute('data-kdl-thumb-seen', '');
    thumbObserver?.observe(li);
  });
}

// List and compact views: hovering a post line shows its thumbnail and title next to it
let preview: HTMLElement | null = null;
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let previewFor: HTMLElement | null = null;

function hidePreview(): void {
  clearTimeout(previewTimer);
  previewFor = null;
  preview?.remove();
  preview = null;
}

function showPreview(li: HTMLElement): void {
  ensureKit();
  addKitStyles('kdl-imp-preview', PREVIEW_STYLES);
  preview?.remove();
  const media = el('div', { className: 'kdl-imp-preview__media' }, [el('span', { className: 'kdl-imp-preview__spin' })]);
  const card = el('div', { className: 'kdl-imp-preview' }, [
    media,
    el('div', { className: 'kdl-imp-preview__title', textContent: li.dataset.kdlTitle || '' }),
    el('div', { className: 'kdl-imp-preview__id', textContent: `#${li.dataset.kdlPost}` }),
  ]);
  card.setAttribute('role', 'tooltip');
  preview = portal(card);
  const place = (): void => {
    if (preview !== card) return;
    const r = li.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + 40));
    const below = r.bottom + 8 + h < window.innerHeight;
    card.style.left = `${left}px`;
    card.style.top = `${below ? r.bottom + 6 : Math.max(12, r.top - h - 6)}px`;
  };
  place();
  const none = (): void => media.replaceChildren(el('span', { className: 'kdl-imp-preview__none', textContent: t('importer.preview.noImage') }));
  void thumbFor(li).then((url) => {
    if (preview !== card) return;
    if (!url) none();
    else {
      const img = el('img', { src: url, alt: '' }) as HTMLImageElement;
      img.addEventListener('load', place, { once: true });
      img.addEventListener('error', () => { none(); place(); }, { once: true });
      media.replaceChildren(img);
    }
    place();
  });
}

function onOver(event: Event): void {
  if (view === 'cards' || !window.matchMedia('(hover: hover)').matches) return;
  const target = event.target as Element | null;
  const li = target?.closest?.(`${SECTION} .log-list > [data-kdl-post]`) as HTMLElement | null;
  if (li === previewFor) return;
  hidePreview();
  if (!li) return;
  previewFor = li;
  previewTimer = setTimeout(() => showPreview(li), 220);
}

let hoverInstalled = false;
function installHover(): void {
  if (hoverInstalled) return;
  hoverInstalled = true;
  document.addEventListener('pointerover', onOver);
  window.addEventListener('scroll', hidePreview, { passive: true });
}
function uninstallHover(): void {
  hoverInstalled = false;
  document.removeEventListener('pointerover', onOver);
  window.removeEventListener('scroll', hidePreview);
  hidePreview();
}

const PREVIEW_STYLES = `
.kdl-imp-preview {
  position: fixed; z-index: ${LAYERS.tooltip}; width: 240px; padding: 8px; box-sizing: border-box;
  border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-popover);
  color: var(--kdl-popover-foreground); box-shadow: var(--kdl-shadow); pointer-events: none;
  font-size: 12px; line-height: 1.4;
}
.kdl-imp-preview__media {
  display: flex; align-items: center; justify-content: center; min-height: 120px; max-height: 260px;
  overflow: hidden; border-radius: calc(var(--kdl-radius) - 2px); background: var(--kdl-muted);
}
.kdl-imp-preview__media img { display: block; width: 100%; height: auto; max-height: 260px; object-fit: cover; }
.kdl-imp-preview__none { color: var(--kdl-muted-foreground); }
.kdl-imp-preview__spin { width: 18px; height: 18px; border: 2px solid var(--kdl-border); border-top-color: var(--kdl-foreground); border-radius: 9999px; animation: kdl-imp-spin 0.8s linear infinite; }
@keyframes kdl-imp-spin { to { transform: rotate(360deg); } }
.kdl-imp-preview__title { margin-top: 6px; font-weight: 600; font-size: 13px; overflow-wrap: anywhere; }
.kdl-imp-preview__id { color: var(--kdl-muted-foreground); font-family: var(--kdl-font-mono, monospace); font-size: 11px; }
`;

let lastCount = 0;

function enhance(): void {
  const section = document.querySelector(SECTION);
  if (!section) return;
  if (!section.hasAttribute(`${MARK}-root`)) {
    const stored = readStored<string>(VIEW_KEY, 'list');
    view = (VIEWS as string[]).includes(stored) ? (stored as View) : 'list';
  }
  installHover();
  syncStatus(section);
  const logs = section.querySelector('.import__logs');
  if (logs && !section.querySelector(`[${MARK}="tools"]`)) {
    logs.prepend(buildTools(section));
    section.setAttribute(`${MARK}-root`, '');
  }
  enhanceLines(section);
  refresh(section);
  const count = section.querySelectorAll('.log-list > .log-list__item').length;
  if (follow && count > lastCount && lastCount > 0) {
    const list = section.querySelector('.log-list');
    const reversed = list?.classList.contains('log-list--reversed');
    const target = reversed ? list?.firstElementChild : list?.lastElementChild;
    (target as HTMLElement | null)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  lastCount = count;
}

function undo(): void {
  uninstallHover();
  thumbObserver?.disconnect();
  thumbObserver = null;
  document.querySelectorAll(`[${MARK}-view]`).forEach((n) => n.removeAttribute(`${MARK}-view`));
  document.querySelectorAll<HTMLElement>('.kdl-imp__reverse').forEach((reverse) => {
    reverse.classList.remove('kdl-imp__reverse');
    document.querySelector('.import__logs-head')?.appendChild(reverse);
  });
  document.querySelectorAll(`[${MARK}="tools"]`).forEach((n) => n.remove());
  document.querySelectorAll<HTMLLIElement>(`.log-list > [${MARK}]`).forEach((li) => {
    const text = ORIGINAL.get(li);
    if (text !== undefined) li.textContent = text;
    li.removeAttribute(MARK);
    li.removeAttribute(`${MARK}-nested`);
    li.removeAttribute(`${MARK}-hidden`);
    li.removeAttribute('data-kdl-thumb-seen');
    ['kdlPost', 'kdlCreator', 'kdlService', 'kdlTitle'].forEach((key) => delete li.dataset[key]);
  });
  document.querySelectorAll(`[${MARK}-state]`).forEach((n) => n.removeAttribute(`${MARK}-state`));
  document.querySelectorAll(`[${MARK}-root]`).forEach((n) => n.removeAttribute(`${MARK}-root`));
  lastCount = 0;
}

const styles = `
${SECTION} .import__status[${MARK}-state] {
  display: inline-flex; align-items: center; gap: 6px; width: fit-content;
  padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--kdl-border, #27272a); background: var(--kdl-secondary, #27272a); color: var(--kdl-foreground, #fafafa);
}
${SECTION} .import__status[${MARK}-state]::before { content: ''; width: 8px; height: 8px; border-radius: 9999px; background: currentColor; }
${SECTION} .import__status[${MARK}-state="done"] { color: var(--kdl-success, #22c55e); border-color: color-mix(in srgb, var(--kdl-success, #22c55e) 40%, transparent); }
${SECTION} .import__status[${MARK}-state="failed"] { color: var(--kdl-danger, #ef4444); border-color: color-mix(in srgb, var(--kdl-danger, #ef4444) 40%, transparent); }
${SECTION} .import__status[${MARK}-state="running"] { color: var(--kdl-info, #3b82f6); border-color: color-mix(in srgb, var(--kdl-info, #3b82f6) 40%, transparent); }
${SECTION} .import__status[${MARK}-state="running"]::before { animation: kdl-imp-pulse 1.2s ease-in-out infinite; }
${SECTION} .import__status[${MARK}-state="waiting"] { color: var(--kdl-muted-foreground, #a1a1aa); }
@keyframes kdl-imp-pulse { 50% { opacity: 0.3; transform: scale(0.7); } }

${SECTION} .kdl-imp__tools { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
${SECTION} .kdl-imp__summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
${SECTION} .kdl-imp__stat {
  display: flex; flex-direction: column; gap: 2px; padding: 10px 12px;
  border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-card);
}
${SECTION} .kdl-imp__stat-value { font-size: 20px; font-weight: 700; line-height: 1.1; color: var(--kdl-foreground); }
${SECTION} .kdl-imp__stat-label { font-size: 12px; color: var(--kdl-muted-foreground); }
${SECTION} .kdl-imp__stat[data-zero="1"] .kdl-imp__stat-value { color: var(--kdl-muted-foreground); }
${SECTION} .kdl-imp__stat[data-stat="posts"]:not([data-zero="1"]) .kdl-imp__stat-value { color: var(--kdl-success); }
${SECTION} .kdl-imp__stat[data-stat="errors"]:not([data-zero="1"]) .kdl-imp__stat-value { color: var(--kdl-danger); }
${SECTION} .kdl-imp__stat[data-stat="flagged"]:not([data-zero="1"]) .kdl-imp__stat-value { color: var(--kdl-warning); }
${SECTION} .kdl-imp__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
${SECTION} .kdl-imp__spacer { flex: 1 1 auto; }
${SECTION} .kdl-imp__search { flex: 1 1 8rem; width: auto; min-width: 8rem; max-width: 16rem; height: 2rem; }
${SECTION} .kdl-imp__copy { width: 2rem; height: 2rem; }
${SECTION} .kdl-imp__seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: var(--kdl-radius); background: var(--kdl-muted); }
${SECTION} .kdl-imp__seg-item {
  height: 1.625rem; padding: 0 0.625rem; border: 0; border-radius: calc(var(--kdl-radius) - 2px);
  background: transparent; color: var(--kdl-muted-foreground); font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
}
${SECTION} .kdl-imp__seg-item:hover { color: var(--kdl-foreground); }
${SECTION} .kdl-imp__seg-item[data-checked] { background: var(--kdl-background); color: var(--kdl-foreground); box-shadow: var(--kdl-shadow-sm); }
${SECTION} .kdl-imp__follow[data-on] { border-color: var(--kdl-ring); color: var(--kdl-foreground); }
${SECTION} .kdl-imp__follow:not([data-on]) { opacity: 0.7; }

${SECTION} .log-list > [${MARK}] {
  display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 5px 10px;
  border-radius: calc(var(--kdl-radius) - 2px); font-size: 13px; line-height: 1.45; list-style: none;
}
${SECTION} .log-list:has(> [${MARK}]) {
  margin: 0; padding: 6px; border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-card);
}
${SECTION} .log-list > [${MARK}] { color: var(--kdl-foreground); }
${SECTION} .log-list > [${MARK}="info"], ${SECTION} .log-list > [${MARK}="skip"] { color: color-mix(in srgb, var(--kdl-foreground) 72%, transparent); }
${SECTION} .log-list > [${MARK}]:hover { background: var(--kdl-accent); }
${SECTION} .import__logs-head:not(:has(*)) { display: none; }
${SECTION} .kdl-imp__reverse {
  display: inline-flex; align-items: center; height: 2rem; margin: 0; padding: 0 0.75rem;
  border: 1px solid var(--kdl-input); border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--kdl-background); color: var(--kdl-foreground); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
}
${SECTION} .kdl-imp__reverse:hover { background: var(--kdl-accent); }
${SECTION} .log-list > [${MARK}-nested] { padding-left: 30px; }
${SECTION} .log-list > [${MARK}-hidden] { display: none; }
${SECTION} .log-list > [${MARK}] .kdl-imp__icon { flex: 0 0 auto; width: 14px; height: 14px; margin-top: 3px; color: var(--kdl-muted-foreground); }
${SECTION} .log-list > [${MARK}] .kdl-imp__text { min-width: 0; overflow-wrap: anywhere; }
${SECTION} .log-list > [${MARK}] a { color: var(--kdl-foreground); text-decoration: underline; text-decoration-color: var(--kdl-border); text-underline-offset: 3px; }
${SECTION} .log-list > [${MARK}] a:hover { text-decoration-color: currentColor; }
${SECTION} .kdl-imp__muted { color: var(--kdl-muted-foreground); font-size: 12px; }
${SECTION} .log-list > [${MARK}="creator"] { margin-top: 6px; font-weight: 600; }
${SECTION} .log-list > [${MARK}="creator"] .kdl-imp__icon { color: var(--kdl-foreground); }
${SECTION} .log-list > [${MARK}="post"] .kdl-imp__icon, ${SECTION} .log-list > [${MARK}="done"] .kdl-imp__icon { color: var(--kdl-success); }
${SECTION} .log-list > [${MARK}="done"] { font-weight: 600; }
${SECTION} .log-list > [${MARK}="warn"] .kdl-imp__icon { color: var(--kdl-warning); }
${SECTION} .log-list > [${MARK}="error"] { background: color-mix(in srgb, var(--kdl-danger) 10%, transparent); }
${SECTION} .log-list > [${MARK}="error"] .kdl-imp__icon { color: var(--kdl-danger); }
${SECTION} .kdl-imp__view { display: inline-flex; align-items: center; justify-content: center; width: 2rem; padding: 0; }
${SECTION} .kdl-imp__view-icon { width: 14px; height: 14px; }
${SECTION} .log-list > [${MARK}] > .kdl-imp__thumb { display: none; }

/* Compact: dense rows, no icons, service lines dimmed */
${SECTION} .log-list[${MARK}-view="compact"] > [${MARK}] { padding: 1px 8px; font-size: 12px; line-height: 1.5; }
${SECTION} .log-list[${MARK}-view="compact"] > [${MARK}] .kdl-imp__icon { display: none; }
${SECTION} .log-list[${MARK}-view="compact"] > [${MARK}-nested] { padding-left: 20px; }
${SECTION} .log-list[${MARK}-view="compact"] > [${MARK}="creator"] { margin-top: 4px; }
${SECTION} .log-list[${MARK}-view="compact"] > :is([${MARK}="info"], [${MARK}="skip"]) { color: var(--kdl-muted-foreground); }

/* Cards: posts as thumbnail tiles in a grid, creator lines as group headings across it, the rest as rows */
${SECTION} .log-list[${MARK}-view="cards"] { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
${SECTION} .log-list[${MARK}-view="cards"] > [${MARK}] { grid-column: 1 / -1; }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] {
  grid-column: auto; flex-direction: column; gap: 6px; padding: 6px; border: 1px solid var(--kdl-border); background: var(--kdl-background);
}
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post]:hover { border-color: var(--kdl-hover-ring, var(--kdl-ring)); background: var(--kdl-background); }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] > .kdl-imp__icon { display: none; }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] > .kdl-imp__thumb {
  display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 1; overflow: hidden;
  border-radius: calc(var(--kdl-radius) - 4px); background: var(--kdl-muted);
}
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] > .kdl-imp__thumb img { width: 100%; height: 100%; object-fit: cover; }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] > .kdl-imp__thumb[data-state="loading"] { animation: kdl-imp-pulse-bg 1.2s ease-in-out infinite; }
${SECTION} .kdl-imp__thumb-icon { width: 22px; height: 22px; color: var(--kdl-muted-foreground); }
@keyframes kdl-imp-pulse-bg { 50% { opacity: 0.55; } }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] .kdl-imp__text { display: flex; flex-direction: column; gap: 2px; font-size: 12px; line-height: 1.35; }
${SECTION} .log-list[${MARK}-view="cards"] > [data-kdl-post] .kdl-imp__text a { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-decoration: none; }
${SECTION} .log-list[${MARK}-view="cards"] > :is([${MARK}="info"], [${MARK}="skip"]) { padding-top: 2px; padding-bottom: 2px; font-size: 12px; }
${SECTION} .log-list[${MARK}-view="cards"] > [${MARK}-nested]:not([data-kdl-post]) { padding-left: 10px; }

@media (max-width: 600px) {
  ${SECTION} .log-list[${MARK}-view="cards"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  ${SECTION} .kdl-imp__search { width: 100%; }
  ${SECTION} .kdl-imp__spacer { display: none; }
}
`;

export const importerStatusModule: KdlModule = {
  id: 'importer.status',
  name: 'Import status page',
  description: 'Import logs with a coloured status, a summary, typed lines with post and creator links, filters, search, follow and copy.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  // Part of the redesign: switched off with it
  requires: ['ui.shadcn'],
  styles,
  mount: enhance,
  update: enhance,
  unmount: undo,
  beforeSnapshot: undo,
};
