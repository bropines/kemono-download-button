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
import { button, ensureKit, input, kitScope } from '../../ui/kit';
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
    label: t('importer.copy'),
    variant: 'outline',
    size: 'sm',
    onClick: () => {
      const text = Array.from(section.querySelectorAll<HTMLElement>(`.log-list > [${MARK}]`))
        .map((li) => ORIGINAL.get(li) || '')
        .join('\n');
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text);
      else void navigator.clipboard?.writeText(text);
      showMessage(t('importer.copied'), 'success');
    },
  });
  const bar = el('div', { className: 'kdl-imp__bar' }, [seg, search, el('span', { className: 'kdl-imp__spacer' }), followBtn, copyBtn]);
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
  renderSummary(section, tools);
  applyFilter(section);
}

let lastCount = 0;

function enhance(): void {
  const section = document.querySelector(SECTION);
  if (!section) return;
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
${SECTION} .kdl-imp__search { width: 14rem; max-width: 100%; height: 2rem; }
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
@media (max-width: 600px) {
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
