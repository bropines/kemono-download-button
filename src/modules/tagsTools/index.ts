// Tag cloud tools: search, sort, group by first letter with a jump bar, and a script filter, on
// /posts/tags (page "list") and /<service>/user/<id>/tags (page "creator").
//
// The site renders `section#tag-container > article > a > span(name) + span(count)`. We work on those
// nodes: articles are re-appended in the chosen order and hidden with a marker attribute; letter headings
// are our own nodes. Unmount (and every htmx snapshot) puts the original order back and drops all of it.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { button, ensureKit, input, kitIcon, select } from '../../ui/kit';
import { t, tx, type UiKey } from '../../i18n';
import { getModuleSetting } from '../../core/registry';

export const TAGS_TOOLS_ID = 'tags.tools';

const CONTAINER = 'section#tag-container';
const HIDDEN_ATTR = 'data-kdl-tag-hidden';
const TOOLBAR_ID = 'kdl-tags-toolbar';

// The layout lives on <html> (set at document start from the stored setting), so the site's cloud is drawn in
// the chosen layout from the first paint. The toolbar's last height is remembered too and reserved above the
// tags until the toolbar is built, so nothing jumps when it arrives.
const LAYOUT_ATTR = 'data-kdl-tags-layout';
const RESERVE_VAR = '--kdl-tags-reserve';
const RESERVE_KEY = 'kdl-tags-toolbar-h';
const layoutOf = (value: unknown): 'grid' | 'cloud' => (value === 'cloud' ? 'cloud' : 'grid');
function setLayoutAttr(layout: 'grid' | 'cloud'): void {
  if (document.documentElement.getAttribute(LAYOUT_ATTR) !== layout) document.documentElement.setAttribute(LAYOUT_ATTR, layout);
}
function readReserve(): number {
  try {
    return Number(localStorage.getItem(RESERVE_KEY)) || 0;
  } catch {
    return 0;
  }
}
function saveReserve(height: number): void {
  try {
    if (height > 0 && Math.abs(readReserve() - height) > 1) localStorage.setItem(RESERVE_KEY, String(Math.round(height)));
  } catch {
    /* storage blocked: the reserve just stays a guess */
  }
}

type SortMode = 'count-desc' | 'count-asc' | 'az' | 'za' | 'site';
type ScriptId = 'all' | 'latin' | 'cyrillic' | 'cjk' | 'other';

interface TagItem {
  node: HTMLElement;
  name: string;
  /** Lowercase, diacritics stripped */
  norm: string;
  /** norm without spaces, dashes and underscores, for "fuzzy-ish" matching */
  compact: string;
  count: number;
  script: Exclude<ScriptId, 'all'>;
  letter: string;
  index: number;
}

const SCRIPT_LABELS: Record<ScriptId, UiKey> = {
  all: 'tags.script.all',
  latin: 'tags.script.latin',
  cyrillic: 'tags.script.cyrillic',
  cjk: 'tags.script.cjk',
  other: 'tags.script.other',
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'site', label: 'Site order' },
  { value: 'count-desc', label: 'Most posts first' },
  { value: 'count-asc', label: 'Fewest posts first' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

const RE_LATIN = /\p{Script=Latin}/u;
const RE_CYRILLIC = /\p{Script=Cyrillic}/u;
const RE_CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const RE_LETTER = /\p{L}/u;
const RE_GROUPABLE = /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]/u;

export function normalize(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase();
}

/** Script of the first letter in the name; names without letters count as Other */
export function detectScript(name: string): TagItem['script'] {
  const letter = [...name].find((ch) => RE_LETTER.test(ch));
  if (!letter) return 'other';
  if (RE_LATIN.test(letter)) return 'latin';
  if (RE_CYRILLIC.test(letter)) return 'cyrillic';
  if (RE_CJK.test(letter)) return 'cjk';
  return 'other';
}

/** Group key: the first character uppercased for Latin/Cyrillic/Greek (diacritics dropped), else "#" */
function letterOf(name: string): string {
  const first = [...normalize(name.trim())][0] ?? '';
  return RE_GROUPABLE.test(first) ? first.toUpperCase() : '#';
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function matches(item: Pick<TagItem, 'norm' | 'compact'>, terms: string[]): boolean {
  return terms.every((term) => item.norm.includes(term) || item.compact.includes(term.replace(/[\s_-]+/g, '')));
}

// ---- state ----

interface Prefs {
  query: string;
  script: ScriptId;
}

let ctxRef: ModuleContext | null = null;
let container: HTMLElement | null = null;
let items: TagItem[] = [];
let toolbar: HTMLElement | null = null;
let headings: HTMLElement[] = [];
let snapshotTimer = 0;
// Not persisted: they belong to the visit (sort and grouping are module settings)
const prefs: Prefs = { query: '', script: 'all' };

function readItems(section: HTMLElement): TagItem[] {
  return Array.from(section.querySelectorAll<HTMLElement>(':scope > article')).map((node, index) => {
    const spans = node.querySelectorAll('span');
    const name = (spans[0]?.textContent ?? node.textContent ?? '').trim();
    const count = Number((spans[1]?.textContent ?? '').replace(/[^\d]/g, '')) || 0;
    const norm = normalize(name);
    return { node, name, norm, compact: norm.replace(/[\s_-]+/g, ''), count, script: detectScript(name), letter: letterOf(name), index };
  });
}

function sorted(list: TagItem[], mode: SortMode): TagItem[] {
  const out = list.slice();
  switch (mode) {
    case 'count-desc':
      return out.sort((a, b) => b.count - a.count || collator.compare(a.name, b.name));
    case 'count-asc':
      return out.sort((a, b) => a.count - b.count || collator.compare(a.name, b.name));
    case 'az':
      return out.sort((a, b) => collator.compare(a.name, b.name));
    case 'za':
      return out.sort((a, b) => collator.compare(b.name, a.name));
    default:
      return out.sort((a, b) => a.index - b.index);
  }
}

/** Letters first (in collation order), "#" last */
function compareLetters(a: string, b: string): number {
  if (a === b) return 0;
  if (a === '#') return 1;
  if (b === '#') return -1;
  return collator.compare(a, b);
}

const headingId = (letter: string) => `kdl-tags-letter-${letter === '#' ? 'other' : encodeURIComponent(letter).replace(/%/g, '')}`;

// ---- render ----

let countLabel: HTMLElement | null = null;
let jumpBar: HTMLElement | null = null;
let sortEl: HTMLSelectElement | null = null;
let groupBtn: HTMLButtonElement | null = null;
let layoutBtn: HTMLButtonElement | null = null;

function syncControls(ctx: ModuleContext): void {
  const on = ctx.settings.get<boolean>('group') === true;
  if (layoutBtn) {
    const grid = ctx.settings.get<string>('layout') !== 'cloud';
    layoutBtn.setAttribute('aria-pressed', String(grid));
    layoutBtn.classList.toggle('kdl-ui-btn--secondary', grid);
    layoutBtn.classList.toggle('kdl-ui-btn--outline', !grid);
  }
  if (sortEl) sortEl.value = ctx.settings.get<string>('sort');
  if (groupBtn) {
    groupBtn.classList.toggle('kdl-ui-btn--secondary', on);
    groupBtn.classList.toggle('kdl-ui-btn--outline', !on);
    groupBtn.setAttribute('aria-pressed', String(on));
  }
}

// Lazy rendering: only the first LAZY_STEP matching tags are shown, the next batch when the end comes near.
// 2000 tags in one grid made every width change (opening the sidebar) re-lay them all out on each frame.
const LAZY_STEP = 300;
const LAZY_ATTR = 'data-kdl-tag-lazy';
let limit = LAZY_STEP;
let lazyMore = false;
let sentinel: HTMLElement | null = null;
let lazyObserver: IntersectionObserver | null = null;
// The matching tags in their current order, as apply() last laid them out
let shownList: TagItem[] = [];

// The next batch: only its rows change (and their letter headings), the other 2000 stay put. A full apply()
// re-sorted and re-appended every row, ~100 ms that the observer spent right as the page was shown.
function showMore(): void {
  const ctx = ctxRef;
  if (!ctx || !container) return;
  const from = limit;
  limit += LAZY_STEP;
  const group = ctx.settings.get<boolean>('group');
  for (let i = from; i < Math.min(limit, shownList.length); i++) {
    const item = shownList[i];
    if (group && item.letter !== shownList[i - 1]?.letter) {
      const heading = el('h3', { className: 'kdl-tags-letter', id: headingId(item.letter), textContent: item.letter });
      headings.push(heading);
      item.node.before(heading);
    }
    item.node.removeAttribute(LAZY_ATTR);
  }
  lazyMore = shownList.length > limit;
}

function ensureSentinel(): void {
  if (!container) return;
  if (!sentinel) sentinel = el('div', { className: 'kdl-tags-sentinel', ariaHidden: 'true' });
  if (sentinel.previousElementSibling !== container) container.after(sentinel);
  if (!lazyObserver && typeof IntersectionObserver === 'function') {
    lazyObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && lazyMore) {
        showMore();
        // Still in range after the batch (a fast scroll, a tall screen): observing anew reports it again
        if (sentinel && lazyObserver) {
          lazyObserver.unobserve(sentinel);
          lazyObserver.observe(sentinel);
        }
      }
    }, { rootMargin: '1200px 0px' });
    lazyObserver.observe(sentinel);
  }
  // No observer (old engine): everything at once
  if (!lazyObserver) limit = Infinity;
}

function dropSentinel(): void {
  lazyObserver?.disconnect();
  lazyObserver = null;
  sentinel?.remove();
  sentinel = null;
  limit = LAZY_STEP;
  shownList = [];
}

/** Reorders and filters the cloud. A new filter, sort or layout starts lazy rendering over (reset). */
function apply(reset = true): void {
  const ctx = ctxRef;
  if (!ctx || !container) return;
  if (reset) limit = LAZY_STEP;
  ensureSentinel();
  const mode = ctx.settings.get<string>('sort') as SortMode;
  const group = ctx.settings.get<boolean>('group');
  const terms = normalize(prefs.query).split(/\s+/).filter(Boolean);

  let list = sorted(items, mode);
  if (group) list = list.slice().sort((a, b) => compareLetters(a.letter, b.letter));

  headings.forEach((node) => node.remove());
  headings = [];
  const shownLetters = new Map<string, number>();
  const frag = document.createDocumentFragment();
  let lastLetter = '';
  let shown = 0;
  shownList = [];
  for (const item of list) {
    const visible = (prefs.script === 'all' || item.script === prefs.script) && matches(item, terms);
    if (visible) shownList.push(item);
    if (visible) item.node.removeAttribute(HIDDEN_ATTR);
    else item.node.setAttribute(HIDDEN_ATTR, '');
    if (visible) {
      shown++;
      shownLetters.set(item.letter, (shownLetters.get(item.letter) ?? 0) + 1);
      const rendered = shown <= limit;
      if (rendered) item.node.removeAttribute(LAZY_ATTR);
      else item.node.setAttribute(LAZY_ATTR, '');
      if (rendered && group && item.letter !== lastLetter) {
        lastLetter = item.letter;
        const heading = el('h3', { className: 'kdl-tags-letter', id: headingId(item.letter), textContent: item.letter });
        headings.push(heading);
        frag.append(heading);
      }
    }
    frag.append(item.node);
  }
  container.append(frag);
  lazyMore = shown > limit;

  if (countLabel) countLabel.textContent = shown === items.length ? t('tags.count', { count: items.length }) : t('tags.countFiltered', { shown, count: items.length });
  container.toggleAttribute('data-kdl-tags-grouped', group);
  setLayoutAttr(layoutOf(ctx.settings.get<string>('layout')));
  // The value is the message the CSS shows
  if (shown === 0) container.setAttribute('data-kdl-tags-empty', t('tags.empty'));
  else container.removeAttribute('data-kdl-tags-empty');
  renderJumpBar(group ? shownLetters : null);
  // Jumped-to headings land below the sticky toolbar
  if (toolbar) {
    container.style.setProperty('--kdl-tags-toolbar-h', `${toolbar.offsetHeight + 12}px`);
    saveReserve(toolbar.offsetHeight);
  }
}

function renderJumpBar(letters: Map<string, number> | null): void {
  if (!jumpBar) return;
  jumpBar.hidden = !letters || letters.size < 2;
  if (!letters) return jumpBar.replaceChildren();
  const keys = [...letters.keys()].sort(compareLetters);
  jumpBar.replaceChildren(
    ...keys.map((letter) =>
      el('button', {
        type: 'button',
        className: 'kdl-tags-jump__key',
        textContent: letter,
        title: t('tags.jump.key', { letter, count: letters.get(letter) ?? 0 }),
        onClick: () => {
          // A letter further down may not be rendered yet: render the rest first
          if (!document.getElementById(headingId(letter)) && lazyMore) {
            limit = Infinity;
            apply(false);
          }
          document.getElementById(headingId(letter))?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        },
      })
    )
  );
}

function scriptOptions(): { value: string; label: string }[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item.script, (counts.get(item.script) ?? 0) + 1));
  return (Object.keys(SCRIPT_LABELS) as ScriptId[])
    .filter((id) => id === 'all' || counts.has(id) || prefs.script === id)
    .map((id) => ({ value: id, label: id === 'all' ? t(SCRIPT_LABELS.all) : `${t(SCRIPT_LABELS[id])} (${counts.get(id) ?? 0})` }));
}

function buildToolbar(ctx: ModuleContext): HTMLElement {
  let timer = 0;
  const search = input({
    type: 'search',
    value: prefs.query,
    placeholder: t('tags.filter.placeholder'),
    ariaLabel: t('tags.filter.label'),
    className: 'kdl-tags-toolbar__search',
    onInput: (value) => {
      prefs.query = value;
      clearTimeout(timer);
      // Instant on small clouds, a short pause on the 2000-tag global one
      timer = window.setTimeout(apply, items.length > 500 ? 80 : 0);
    },
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      event.preventDefault();
      search.value = '';
      prefs.query = '';
      apply();
    }
  });
  sortEl = select({
    ariaLabel: t('tags.sort.label'),
    // Same texts as the module setting's options
    options: SORT_OPTIONS.map((o) => ({ value: o.value, label: tx(`mod.${TAGS_TOOLS_ID}.setting.sort.option.${o.value}`, o.label) })),
    value: ctx.settings.get<string>('sort'),
    onChange: (value) => ctx.settings.set('sort', value),
  });
  const script = select({
    ariaLabel: t('tags.script.label'),
    options: scriptOptions(),
    value: prefs.script,
    onChange: (value) => {
      prefs.script = value as ScriptId;
      apply();
    },
  });
  groupBtn = button({
    label: t('tags.group.button'),
    icon: 'list',
    variant: ctx.settings.get<boolean>('group') ? 'secondary' : 'outline',
    title: t('tags.group.title'),
    size: 'sm',
    className: 'kdl-tags-toolbar__group',
    onClick: () => ctx.settings.set('group', !ctx.settings.get<boolean>('group')),
  });
  layoutBtn = button({
    icon: 'layout-grid',
    variant: 'outline',
    size: 'icon',
    title: t('tags.layout.title'),
    ariaLabel: t('tags.layout.title'),
    className: 'kdl-tags-toolbar__layout',
    onClick: () => ctx.settings.set('layout', ctx.settings.get<string>('layout') === 'cloud' ? 'grid' : 'cloud'),
  });
  countLabel = el('span', { className: 'kdl-tags-toolbar__count', role: 'status' });
  jumpBar = el('nav', { className: 'kdl-tags-jump' });
  jumpBar.setAttribute('aria-label', t('tags.jump.label'));

  return el('div', { id: TOOLBAR_ID, className: 'kdl-scope kdl-tags-toolbar' }, [
    el('div', { className: 'kdl-tags-toolbar__row' }, [
      el('label', { className: 'kdl-tags-toolbar__field' }, [kitIcon('search'), search]),
      sortEl,
      script,
      groupBtn,
      layoutBtn,
      countLabel,
    ]),
    jumpBar,
  ]);
}

function build(ctx: ModuleContext, section: HTMLElement): void {
  ensureKit();
  container = section;
  items = readItems(section);
  if (!items.length) {
    container = null;
    return;
  }
  // Keep the visit's filter when a snapshot rebuilt us, but drop a script choice that no longer exists
  if (prefs.script !== 'all' && !items.some((i) => i.script === prefs.script)) prefs.script = 'all';
  // Popularity bar of the list layout, on a square-root scale: linear leaves all but the top few tags empty,
  // a log scale fills nearly every bar
  const top = Math.sqrt(Math.max(...items.map((item) => item.count), 1));
  items.forEach((item) => item.node.style.setProperty('--kdl-tag-p', `${((Math.sqrt(item.count) / top) * 100).toFixed(1)}%`));
  toolbar = buildToolbar(ctx);
  syncControls(ctx);
  section.before(toolbar);
  apply();
}

/** Original order and visibility back, our nodes gone */
function restore(): void {
  clearTimeout(snapshotTimer);
  headings.forEach((node) => node.remove());
  headings = [];
  if (container?.isConnected) {
    const frag = document.createDocumentFragment();
    items
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach((item) => {
        item.node.removeAttribute(HIDDEN_ATTR);
        item.node.removeAttribute(LAZY_ATTR);
        item.node.style.removeProperty('--kdl-tag-p');
        if (!item.node.getAttribute('style')) item.node.removeAttribute('style');
        frag.append(item.node);
      });
    container.append(frag);
    container.removeAttribute('data-kdl-tags-grouped');
    container.removeAttribute('data-kdl-tags-empty');
    container.style.removeProperty('--kdl-tags-toolbar-h');
    if (!container.getAttribute('style')) container.removeAttribute('style');
  }
  dropSentinel();
  toolbar?.remove();
  document.getElementById(TOOLBAR_ID)?.remove();
  toolbar = null;
  countLabel = null;
  jumpBar = null;
  sortEl = null;
  groupBtn = null;
  layoutBtn = null;
  container = null;
  items = [];
}

function sync(ctx: ModuleContext): void {
  const section = document.querySelector<HTMLElement>(CONTAINER);
  if (section && section === container && toolbar?.isConnected) return;
  // A swap replaced the cloud (or it rendered late): start over on the new one
  if (container || toolbar) restore();
  if (section) build(ctx, section);
}

const styles = `
.kdl-tags-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  width: min(80vw, 100%);
  margin: 1em auto 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: color-mix(in srgb, var(--kdl-background) 88%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}
.kdl-tags-toolbar__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.kdl-tags-toolbar__field { position: relative; flex: 1 1 220px; min-width: 0; display: flex; align-items: center; }
.kdl-tags-toolbar__field > .kdl-ui-icon { position: absolute; left: 10px; width: 16px; height: 16px; color: var(--kdl-muted-foreground); pointer-events: none; }
.kdl-tags-toolbar .kdl-tags-toolbar__search { padding-left: 32px; width: 100%; }
.kdl-tags-toolbar .kdl-ui-select { width: auto; flex: 0 1 auto; min-width: 0; padding-right: 2rem; white-space: nowrap; text-overflow: ellipsis; }
.kdl-tags-toolbar__count { margin-left: auto; font-size: 13px; color: var(--kdl-muted-foreground); white-space: nowrap; font-variant-numeric: tabular-nums; }
.kdl-tags-jump { display: flex; flex-wrap: wrap; gap: 2px; }
.kdl-tags-jump[hidden] { display: none; }
.kdl-tags-toolbar .kdl-tags-jump__key {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border: 0;
  border-radius: calc(var(--kdl-radius) - 2px);
  background: transparent;
  color: var(--kdl-foreground);
  font: 500 12px/26px var(--kdl-font);
  cursor: pointer;
}
.kdl-tags-toolbar .kdl-tags-jump__key:hover, .kdl-tags-toolbar .kdl-tags-jump__key:focus-visible { background: var(--kdl-accent); color: var(--kdl-accent-foreground); outline: none; }
/* html[...] lifts these over the list layout's display: block !important */
section#tag-container > article[${HIDDEN_ATTR}], section#tag-container > article[${LAZY_ATTR}],
html[data-kdl-tags-layout] section#tag-container > article:is([${HIDDEN_ATTR}], [${LAZY_ATTR}]) { display: none !important; }
.kdl-tags-sentinel { height: 1px; }
/* Before the toolbar is built (the site's markup, first paint): only the first batch is drawn */
html[data-kdl-tags-layout] section#tag-container:not(.kdl-tags-toolbar + section#tag-container) > article:nth-child(n+${LAZY_STEP + 1}) { display: none !important; }
section#tag-container > .kdl-tags-letter {
  flex: 0 0 100%;
  margin: 0.75em 0 0.25em;
  padding: 0 0 4px;
  border-bottom: 1px solid var(--kdl-border, rgba(127, 127, 127, 0.3));
  font-size: 1.1em;
  font-weight: 600;
  text-align: left;
  scroll-margin-top: var(--kdl-tags-toolbar-h, 120px);
}
section#tag-container[data-kdl-tags-grouped] { justify-content: flex-start; }
/* Room for the toolbar until it is built (its last height, see RESERVE_KEY) */
html[data-kdl-tags-layout] section#tag-container:not(.kdl-tags-toolbar + section#tag-container) {
  margin-top: calc(var(${RESERVE_VAR}, 0px) + 2em) !important;
}
/* List layout: columns of rows, name left, post count right, a bar for popularity */
html[data-kdl-tags-layout="grid"] section#tag-container {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2px 12px !important;
  width: min(80vw, 100%);
  margin-inline: auto;
  padding: 12px 0;
  box-sizing: border-box;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article {
  display: block !important;
  /* Rows off screen skip rendering */
  content-visibility: auto;
  contain-intrinsic-size: auto 30px;
  width: auto !important;
  min-width: 0;
  margin: 0 !important;
  border: 0 !important;
  border-radius: calc(var(--kdl-radius, 8px) - 2px) !important;
  background: none !important;
  overflow: hidden;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article > a {
  display: flex !important;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px !important;
  border-radius: inherit !important;
  background:
    linear-gradient(to right, color-mix(in srgb, var(--kdl-primary, #888) 22%, transparent) var(--kdl-tag-p, 0%), transparent 0),
    color-mix(in srgb, var(--kdl-muted, #444) 45%, transparent) !important;
  color: var(--kdl-foreground, inherit) !important;
  line-height: 1;
  text-decoration: none;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article > a:is(:hover, :focus-visible) {
  background:
    linear-gradient(to right, color-mix(in srgb, var(--kdl-primary, #888) 32%, transparent) var(--kdl-tag-p, 0%), transparent 0),
    var(--kdl-accent, rgba(127, 127, 127, 0.25)) !important;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article > a > span {
  display: block;
  height: auto !important;
  padding: 0 !important;
  line-height: 1.3 !important;
  font-size: 13px !important;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article > a > span:first-child {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
html[data-kdl-tags-layout="grid"] section#tag-container > article > a > span:nth-child(2) {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--kdl-foreground, #fff) 70%, transparent) !important;
  font-size: 12px !important;
  font-variant-numeric: tabular-nums;
}
html[data-kdl-tags-layout="grid"] section#tag-container > .kdl-tags-letter,
html[data-kdl-tags-layout="grid"] section#tag-container[data-kdl-tags-empty]::before { grid-column: 1 / -1; }
section#tag-container[data-kdl-tags-empty]::before { content: attr(data-kdl-tags-empty); flex: 0 0 100%; padding: 2em 0; text-align: center; opacity: 0.6; }
@media (max-width: 640px) {
  .kdl-tags-toolbar { width: auto; margin: 0.5em 0 0; }
  html[data-kdl-tags-layout="grid"] section#tag-container { width: 100%; }
  .kdl-tags-toolbar__field { flex-basis: 100%; }
  .kdl-tags-toolbar .kdl-ui-select { flex: 1 1 40%; }
  .kdl-tags-toolbar__count { margin-left: 0; }
}
`;

export const tagsToolsModule: KdlModule = {
  id: TAGS_TOOLS_ID,
  name: 'Tag tools',
  description: 'On tag pages: filter the tag cloud as you type, sort it by post count or name, group it by first letter with a jump bar, and show only Latin, Cyrillic, CJK or other tags.',
  group: 'Lists',
  // /posts/tags is a "list" page, /<service>/user/<id>/tags a "creator" page; the tag cloud decides
  pages: ['list', 'creator'],
  defaultEnabled: true,
  settings: [
    { key: 'sort', label: 'Default sort', type: 'select', default: 'site', options: SORT_OPTIONS },
    { key: 'group', label: 'Group by first letter', type: 'boolean', default: false },
    {
      key: 'layout', label: 'Layout', type: 'select', default: 'grid',
      options: [{ value: 'grid', label: 'List in columns' }, { value: 'cloud', label: 'Cloud (as on the site)' }],
    },
  ],
  styles,
  mount(ctx) {
    ctxRef = ctx;
    const changed = () => {
      syncControls(ctx);
      apply();
    };
    ctx.settings.onChange('sort', changed);
    ctx.settings.onChange('group', changed);
    ctx.settings.onChange('layout', changed);
    setLayoutAttr(layoutOf(ctx.settings.get<string>('layout')));
    const reserve = readReserve();
    if (reserve) document.documentElement.style.setProperty(RESERVE_VAR, `${reserve}px`);
    sync(ctx);
    ctx.onCleanup(() => {
      document.documentElement.removeAttribute(LAYOUT_ATTR);
      document.documentElement.style.removeProperty(RESERVE_VAR);
      restore();
      ctxRef = null;
      prefs.query = '';
      prefs.script = 'all';
    });
  },
  update(ctx) {
    sync(ctx);
  },
  early() {
    setLayoutAttr(layoutOf(getModuleSetting(TAGS_TOOLS_ID, 'layout')));
    const reserve = readReserve();
    if (reserve) document.documentElement.style.setProperty(RESERVE_VAR, `${reserve}px`);
  },
  beforeSnapshot() {
    // htmx clones the DOM synchronously after this hook; rebuild right after with the same filter
    restore();
    snapshotTimer = window.setTimeout(() => ctxRef && sync(ctxRef), 0);
  },
};
