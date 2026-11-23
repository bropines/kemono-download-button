// Search across every tab of the Settings dialog.
//
// The index is the rendered dialog itself: on the first query every tab is rendered, then each query walks the
// panels and marks what it finds. A field matches on its visible label and description, a card on its title and
// description (a match there keeps the whole card), any other block on its visible text. So a setting added later,
// in any tab or module card, is found without being listed anywhere. While searching every panel is shown at once
// under its tab name, and the rows that do not match are hidden; the controls stay live.
import { el } from '../../utils/dom';
import { emptyState, input, kbd, kitIcon } from '../kit';
import { t } from '../../i18n';
import { foldText, matchesTerms, queryTerms } from './searchText';

const MISS = 'data-kdl-miss';
const HIT = 'data-kdl-hit';
const FLASH = 'data-kdl-flash';
const FLASH_MS = 1800;
const CARD = '.kdl-settings__section';
const FIELD = '.kdl-ui-field';
const GROUP = '.kdl-settings__module-group';
const TAB_HEADING = 'kdl-settings__search-tab';
// Not results: the module copies listed next to the settings they affect (the Modules tab lists them all), the
// Modules tab's own filter, page badges and notices of module cards, empty states
const SKIP = '.kdl-settings__related-modules, .kdl-settings__module-search, .kdl-settings__module-badges, .kdl-settings__module-notice, .kdl-ui-empty, script, style';
const INTERACTIVE = 'button, input, select, textarea, a[href], summary, [role="switch"], [role="slider"], [contenteditable]';

export interface SettingsSearch {
  /** The search box, for the dialog header. */
  field: HTMLElement;
  /** Takes over a freshly built tabs element (first build, import, reset) and applies the current query to it. */
  attach(tabs: HTMLElement): void;
  focus(): void;
  query(): string;
  /** Empties the box; jumps to the result last used, if any. */
  clear(): void;
}

interface Options {
  dialog: HTMLElement;
  body: HTMLElement;
  /** Renders the panels of tabs never opened yet, keeping the current tab. */
  renderAll(tabs: HTMLElement): void;
}

function visibleText(node: Element): string {
  let text = '';
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('option, select, textarea, script, style, svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  while (walker.nextNode()) text += ` ${walker.currentNode.nodeValue}`;
  return foldText(text);
}

function textOf(nodes: Iterable<Element>): string {
  return foldText([...nodes].map((node) => node.textContent ?? '').join(' '));
}

const fieldText = (field: Element): string => {
  const parts = field.querySelectorAll(':scope > .kdl-ui-label, :scope > .kdl-ui-field__description, :scope > .kdl-ui-field__text > .kdl-ui-label, :scope > .kdl-ui-field__text > .kdl-ui-field__description');
  return parts.length ? textOf(parts) : visibleText(field);
};

const isList = (node: Element): boolean => {
  const rows = Array.from(node.children);
  const first = rows[0];
  return rows.length > 1 && !!first.className && rows.every((row) => row.tagName === first.tagName && row.className === first.className);
};

const mark = (node: Element, hit: boolean): number => {
  node.setAttribute(hit ? HIT : MISS, '');
  return hit ? 1 : 0;
};

/** Marks the matches under `node` and hides the rest; returns the number of results. */
function visit(node: Element, terms: string[]): number {
  if ((node as HTMLElement).hidden) return 0;
  if (node.matches(SKIP)) return mark(node, false);
  if (node.matches(CARD)) {
    if (matchesTerms(textOf(node.querySelectorAll(':scope > .kdl-settings__section-head .kdl-settings__section-title, :scope > .kdl-settings__section-description')), terms)) return mark(node, true);
    const content = node.querySelector(':scope > .kdl-ui-card__content');
    const found = content ? visitChildren(content, terms) : 0;
    if (!found) mark(node, false);
    return found;
  }
  if (node.matches(GROUP)) {
    const title = node.querySelector(':scope > .kdl-settings__module-group-title');
    if (title && matchesTerms(foldText(title.textContent ?? ''), terms)) return mark(node, true);
    const found = visitChildren(node, terms, title);
    if (!found) mark(node, false);
    return found;
  }
  if (node.matches(FIELD)) return mark(node, matchesTerms(fieldText(node), terms));
  // A list of like rows (theme presets, chips) is searched row by row, like a group of fields
  if (node.querySelector(`${FIELD}, ${CARD}`) || isList(node)) {
    const found = visitChildren(node, terms);
    if (!found) mark(node, false);
    return found;
  }
  return mark(node, matchesTerms(visibleText(node), terms));
}

function visitChildren(node: Element, terms: string[], skip?: Element | null): number {
  let found = 0;
  for (const child of Array.from(node.children)) if (child !== skip) found += visit(child, terms);
  return found;
}

export function createSettingsSearch(options: Options): SettingsSearch {
  const { dialog, body } = options;
  let tabs: HTMLElement | null = null;
  let last: HTMLElement | null = null;
  let frame = 0;

  const box = input({
    id: 'kdl-settings-search',
    type: 'search',
    placeholder: t('settings.search.placeholder'),
    ariaLabel: t('settings.search.label'),
    autocomplete: 'off',
    onInput: () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (box.value.trim() ? apply() : clear()));
    },
  });
  box.spellcheck = false;
  const field = el('div', { className: 'kdl-settings__search' }, [kitIcon('search'), box, kbd('/', { className: 'kdl-settings__search-kbd' })]);
  field.setAttribute('role', 'search');
  const status = el('p', { className: 'kdl-settings__search-status' });
  status.setAttribute('aria-live', 'polite');
  const empty = emptyState({ icon: 'search', title: '', description: t('settings.search.emptyHint'), className: 'kdl-settings__search-empty' });

  const panels = (): HTMLElement[] => (tabs ? Array.from(tabs.querySelectorAll<HTMLElement>(':scope > .kdl-ui-tabs__panel')) : []);
  const triggerOf = (panel: Element): HTMLElement | null => {
    const id = panel.getAttribute('aria-labelledby');
    return id ? dialog.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
  };

  function unmark(): void {
    dialog.querySelectorAll(`[${MISS}], [${HIT}]`).forEach((node) => {
      node.removeAttribute(MISS);
      node.removeAttribute(HIT);
    });
  }

  function reset(): void {
    cancelAnimationFrame(frame);
    box.value = '';
    dialog.removeAttribute('data-searching');
    unmark();
    status.textContent = '';
    empty.hidden = true;
  }

  function apply(): void {
    if (!tabs) return;
    const terms = queryTerms(box.value);
    if (!terms.length) return reset();
    options.renderAll(tabs);
    // The Modules tab's own filter would hide cards behind the global one
    const local = dialog.querySelector<HTMLInputElement>('#kdl-modules-search');
    if (local?.value) {
      local.value = '';
      local.dispatchEvent(new Event('input'));
    }
    unmark();
    dialog.setAttribute('data-searching', '');
    let total = 0;
    for (const panel of panels()) {
      const label = triggerOf(panel)?.textContent?.trim() ?? '';
      let heading = panel.querySelector<HTMLElement>(`:scope > .${TAB_HEADING}`);
      if (!heading) {
        heading = el('p', { className: TAB_HEADING });
        panel.prepend(heading);
      }
      heading.textContent = label;
      // The tab's own name: all of it
      const found = matchesTerms(foldText(label), terms) ? 1 : visitChildren(panel, terms, heading);
      if (!found) mark(panel, false);
      total += found;
    }
    status.textContent = total ? t('settings.search.count', { count: total }) : '';
    empty.querySelector('.kdl-ui-empty__title')!.textContent = t('settings.search.empty', { query: box.value.trim() });
    empty.hidden = total > 0;
    body.scrollTop = 0;
  }

  function flash(node: HTMLElement): void {
    node.removeAttribute(FLASH);
    void node.offsetWidth;
    node.setAttribute(FLASH, '');
    setTimeout(() => node.removeAttribute(FLASH), FLASH_MS);
  }

  /** Leaves the search and shows `node` in its own tab. */
  function jumpTo(node: HTMLElement): void {
    reset();
    last = null;
    const panel = node.closest('.kdl-ui-tabs__panel');
    const trigger = panel ? triggerOf(panel) : null;
    if (trigger && trigger.getAttribute('aria-selected') !== 'true') trigger.click();
    trigger?.scrollIntoView({ block: 'nearest', inline: 'center' });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      flash(node);
    });
  }

  function clear(): void {
    const target = last?.isConnected ? last : null;
    if (target) jumpTo(target);
    else reset();
  }

  // A result's name or description opens it in its tab; its controls keep working in place
  body.addEventListener('click', (event) => {
    if (!dialog.hasAttribute('data-searching')) return;
    const target = event.target as Element;
    const row = target.closest<HTMLElement>(`[${HIT}]`);
    if (!row || !body.contains(row)) return;
    const control = target.closest(INTERACTIVE);
    if (control && row.contains(control) && !target.closest('label')) return;
    event.preventDefault();
    jumpTo(target.closest<HTMLElement>(FIELD) ?? row);
  });
  // The result last used: clearing the search lands on it
  const remember = (event: Event) => {
    if (!dialog.hasAttribute('data-searching')) return;
    const row = (event.target as Element).closest<HTMLElement>(`[${HIT}]`);
    if (row) last = (event.target as Element).closest<HTMLElement>(FIELD) ?? row;
  };
  body.addEventListener('focusin', remember);
  body.addEventListener('change', remember);

  box.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = dialog.querySelector<HTMLElement>(`[${HIT}]`);
    if (first) jumpTo(first);
  });

  return {
    field,
    attach(next) {
      tabs = next;
      last = null;
      body.prepend(status);
      body.append(empty);
      if (box.value.trim()) apply();
      else reset();
    },
    focus() {
      box.focus();
      box.select();
    },
    query: () => box.value,
    clear,
  };
}
