// Settings editor for the "Search sites" setting: a list of sites (name + URL template) with add, edit,
// remove, reorder and reset to defaults. It reads and writes the same "Label | URL" text the setting has
// always stored (searchSites.ts), so export/import and older versions see no difference.

import type { SettingEditor, SettingValue } from '../../core/types';
import { el } from '../../utils/dom';
import { addKitStyles, button, dismissable, emptyState, field, input, kitIcon, setFieldError, toast } from '../../ui/kit';
import { css } from '../../utils/cssBuilder';
import { t, type UiKey } from '../../i18n';
import {
  DEFAULT_SEARCHES,
  SEARCH_PLACEHOLDERS,
  parseSearchSites,
  searchSiteProblem,
  serializeSearchSites,
  type SearchSite,
  type SearchSiteProblem,
} from './searchSites';

const STYLE_ID = 'kdl-sse-styles';

const PROBLEM_TEXT: Record<SearchSiteProblem, UiKey> = {
  labelMissing: 'xlinks.editor.problem.labelMissing',
  labelPipe: 'xlinks.editor.problem.labelPipe',
  urlMissing: 'xlinks.editor.problem.urlMissing',
  urlScheme: 'xlinks.editor.problem.urlScheme',
  urlInvalid: 'xlinks.editor.problem.urlInvalid',
  placeholderMissing: 'xlinks.editor.problem.placeholderMissing',
};
const LABEL_PROBLEMS: SearchSiteProblem[] = ['labelMissing', 'labelPipe'];

const PLACEHOLDER_HINT: Record<(typeof SEARCH_PLACEHOLDERS)[number], UiKey> = {
  '{name}': 'xlinks.editor.nameHint',
  '{tag}': 'xlinks.editor.tagHint',
};

const STYLES = css({
  '.kdl-sse': { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  '.kdl-sse__list': { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none', border: '1px solid var(--kdl-border)', borderRadius: 'var(--kdl-radius)', overflow: 'hidden' },
  '.kdl-sse__list:empty': { display: 'none' },
  '.kdl-sse__row': { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 8px 8px 12px', minWidth: 0 },
  '.kdl-sse__row + .kdl-sse__row': { borderTop: '1px solid var(--kdl-border)' },
  '.kdl-sse__row[data-invalid]': { background: 'color-mix(in srgb, var(--kdl-warning) 8%, transparent)' },
  '.kdl-sse__main': { display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: 0 },
  '.kdl-sse__label': { fontSize: '14px', fontWeight: 500, color: 'var(--kdl-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  '.kdl-sse__label[data-empty]': { color: 'var(--kdl-muted-foreground)', fontStyle: 'italic', fontWeight: 400 },
  '.kdl-sse__url': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12px',
    color: 'var(--kdl-muted-foreground)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '.kdl-sse__ph': { color: 'var(--kdl-primary)', fontWeight: 600 },
  '.kdl-sse__problem': { display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '12px', color: 'var(--kdl-warning)' },
  '.kdl-sse__problem .kdl-ui-icon': { width: '13px', height: '13px', flex: '0 0 auto' },
  '.kdl-sse__actions': { display: 'flex', alignItems: 'center', gap: '2px', flex: '0 0 auto' },
  '.kdl-sse__actions .kdl-ui-btn': { width: '32px', height: '32px' },
  '.kdl-sse__actions .kdl-ui-icon': { width: '15px', height: '15px' },
  '.kdl-sse__form': { display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'var(--kdl-muted)', minWidth: 0 },
  '.kdl-sse__row + .kdl-sse__form, .kdl-sse__form + .kdl-sse__row': { borderTop: '1px solid var(--kdl-border)' },
  '.kdl-sse__form .kdl-ui-input': { width: '100%', background: 'var(--kdl-background)' },
  '.kdl-sse__url-input': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '13px' },
  '.kdl-sse__insert': { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '12px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-sse__insert .kdl-ui-btn': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  '.kdl-sse__form-actions': { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  '.kdl-sse__foot': { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  '.kdl-sse__count': { marginLeft: 'auto', fontSize: '12px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-sse .kdl-ui-empty': { border: '1px dashed var(--kdl-border)', borderRadius: 'var(--kdl-radius)', padding: '16px' },
  // Phones: name and buttons share the first line, the URL and any problem take the full width below
  '@media (max-width: 640px)': {
    '.kdl-sse__row': { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '4px', rowGap: '2px', padding: '6px 4px 8px 10px' },
    '.kdl-sse__main': { display: 'contents' },
    '.kdl-sse__label': { gridColumn: '1', gridRow: '1' },
    '.kdl-sse__actions': { gridColumn: '2', gridRow: '1', gap: 0 },
    '.kdl-sse__url, .kdl-sse__problem': { gridColumn: '1 / -1', paddingRight: '6px' },
    '.kdl-sse__url': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
    '.kdl-sse__form-actions .kdl-ui-btn': { flex: '1 1 0' },
    '.kdl-sse__count': { flexBasis: '100%', marginLeft: 0, order: -1 },
  },
});

/** The URL with its placeholders highlighted */
function urlText(url: string): HTMLElement {
  const parts = url.split(/(\{name\}|\{tag\})/).filter(Boolean);
  return el('span', { className: 'kdl-sse__url', title: url }, parts.map((part) =>
    /^\{(name|tag)\}$/.test(part) ? el('span', { className: 'kdl-sse__ph', textContent: part }) : part
  ));
}

const iconButton = (icon: 'chevron-up' | 'chevron-down' | 'pencil' | 'trash-2', label: string, onClick: () => void, disabled = false) =>
  button({ icon, size: 'icon', variant: 'ghost', ariaLabel: label, title: label, disabled, onClick });

export const searchSitesEditor: SettingEditor = ({ id, value, save }) => {
  addKitStyles(STYLE_ID, STYLES);
  let sites = parseSearchSites(String(value));
  // Index of the entry being edited, sites.length while adding, null when the form is closed
  let editing: number | null = null;
  // Escape closes the open form before the settings dialog (the kit keeps a stack of dismissable layers)
  let releaseForm: (() => void) | null = null;

  const list = el('ul', { className: 'kdl-sse__list' });
  const empty = emptyState({ icon: 'search', title: t('xlinks.editor.empty') });
  const count = el('span', { className: 'kdl-sse__count' });
  const add = button({ label: t('xlinks.editor.add'), icon: 'plus', variant: 'outline', size: 'sm', onClick: () => openForm(sites.length) });
  const reset = button({ label: t('xlinks.editor.reset'), icon: 'rotate-ccw', variant: 'ghost', size: 'sm', onClick: resetToDefaults });
  const root = el('div', { className: 'kdl-sse', id }, [list, empty, el('div', { className: 'kdl-sse__foot' }, [add, reset, count])]);

  function commit(next: SearchSite[], undo?: { title: string; previous: SearchSite[] }): void {
    sites = next;
    editing = null;
    save(serializeSearchSites(sites));
    render();
    if (undo) {
      toast({ title: undo.title, action: { label: t('xlinks.editor.undo'), onClick: () => commit(undo.previous) } });
    }
  }

  function resetToDefaults(): void {
    commit(parseSearchSites(DEFAULT_SEARCHES), { title: t('xlinks.editor.resetDone'), previous: sites });
  }

  function move(index: number, by: number): void {
    const next = sites.slice();
    const [site] = next.splice(index, 1);
    next.splice(index + by, 0, site);
    commit(next);
    // Keep the keyboard on the moved row
    const target = list.children[index + by]?.querySelector<HTMLButtonElement>(`[data-move="${by < 0 ? 'up' : 'down'}"]:not(:disabled)`);
    (target ?? list.children[index + by]?.querySelector<HTMLButtonElement>('[data-action="edit"]'))?.focus();
  }

  function openForm(index: number): void {
    editing = index;
    render();
    list.querySelector<HTMLInputElement>('.kdl-sse__form input')?.focus();
  }

  function row(site: SearchSite, index: number): HTMLElement {
    const problem = searchSiteProblem(site);
    const name = site.label || t('xlinks.editor.untitled');
    const label = el('span', { className: 'kdl-sse__label', textContent: name });
    if (!site.label) label.dataset.empty = '';
    const up = iconButton('chevron-up', t('xlinks.editor.moveUp', { label: name }), () => move(index, -1), index === 0);
    const down = iconButton('chevron-down', t('xlinks.editor.moveDown', { label: name }), () => move(index, 1), index === sites.length - 1);
    const edit = iconButton('pencil', t('xlinks.editor.edit', { label: name }), () => openForm(index));
    const remove = iconButton('trash-2', t('xlinks.editor.remove', { label: name }), () =>
      commit(sites.filter((_, i) => i !== index), { title: t('xlinks.editor.removed', { label: name }), previous: sites })
    );
    up.dataset.move = 'up';
    down.dataset.move = 'down';
    edit.dataset.action = 'edit';
    const node = el('li', { className: 'kdl-sse__row' }, [
      el('div', { className: 'kdl-sse__main' }, [
        label,
        site.url ? urlText(site.url) : null,
        problem ? el('p', { className: 'kdl-sse__problem' }, [kitIcon('triangle-alert'), el('span', { textContent: t(PROBLEM_TEXT[problem]) })]) : null,
      ]),
      el('div', { className: 'kdl-sse__actions' }, [up, down, edit, remove]),
    ]);
    if (problem) node.dataset.invalid = problem;
    return node;
  }

  function form(index: number): HTMLElement {
    const current = sites[index] ?? { label: '', url: '' };
    let tried = false;
    const labelInput = input({ value: current.label, placeholder: t('xlinks.editor.labelPlaceholder'), onInput: () => tried && check() });
    const urlInput = input({
      type: 'url',
      value: current.url,
      placeholder: t('xlinks.editor.urlPlaceholder'),
      className: 'kdl-sse__url-input',
      autocomplete: 'off',
      onInput: () => tried && check(),
    });
    urlInput.spellcheck = false;
    const labelField = field({ label: t('xlinks.editor.label'), control: labelInput });
    const insert = el('div', { className: 'kdl-sse__insert' }, [
      t('xlinks.editor.insert'),
      ...SEARCH_PLACEHOLDERS.map((placeholder) =>
        button({
          label: placeholder,
          size: 'sm',
          variant: 'outline',
          title: t(PLACEHOLDER_HINT[placeholder]),
          onClick: () => {
            const start = urlInput.selectionStart ?? urlInput.value.length;
            const end = urlInput.selectionEnd ?? start;
            urlInput.setRangeText(placeholder, start, end, 'end');
            urlInput.focus();
            if (tried) check();
          },
        })
      ),
    ]);
    const urlField = field({ label: t('xlinks.editor.url'), control: urlInput });
    urlField.querySelector('.kdl-ui-field__error')?.before(insert);

    const draft = (): SearchSite => ({ label: labelInput.value.trim(), url: urlInput.value.trim() });
    function check(): boolean {
      const problem = searchSiteProblem(draft());
      const onLabel = !!problem && LABEL_PROBLEMS.includes(problem);
      setFieldError(labelField, onLabel ? t(PROBLEM_TEXT[problem!]) : null);
      setFieldError(urlField, problem && !onLabel ? t(PROBLEM_TEXT[problem]) : null);
      return !problem;
    }
    function submit(): void {
      tried = true;
      if (!check()) {
        const problem = searchSiteProblem(draft());
        (problem && LABEL_PROBLEMS.includes(problem) ? labelInput : urlInput).focus();
        return;
      }
      const next = sites.slice();
      next.splice(index, index < sites.length ? 1 : 0, draft());
      commit(next);
      list.children[index]?.querySelector<HTMLButtonElement>('[data-action="edit"]')?.focus();
    }
    function cancel(): void {
      editing = null;
      render();
      (index < sites.length ? list.children[index]?.querySelector<HTMLButtonElement>('[data-action="edit"]') : add)?.focus();
    }

    const node = el('li', { className: 'kdl-sse__form' }, [
      labelField,
      urlField,
      el('div', { className: 'kdl-sse__form-actions' }, [
        button({ label: t('xlinks.editor.cancel'), variant: 'ghost', size: 'sm', onClick: cancel }),
        button({ label: t(index < sites.length ? 'xlinks.editor.save' : 'xlinks.editor.addConfirm'), icon: 'check', size: 'sm', onClick: submit }),
      ]),
    ]);
    node.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || (event.target as HTMLElement).tagName !== 'INPUT') return;
      event.preventDefault();
      submit();
    });
    releaseForm = dismissable(node, {
      outside: false,
      onDismiss: () => {
        if (node.isConnected) cancel();
        else releaseForm?.();
      },
    });
    return node;
  }

  function render(): void {
    releaseForm?.();
    releaseForm = null;
    const nodes = sites.map((site, index) => (index === editing ? form(index) : row(site, index)));
    if (editing === sites.length) nodes.push(form(editing));
    list.replaceChildren(...nodes);
    empty.hidden = nodes.length > 0;
    add.disabled = editing !== null;
    reset.disabled = serializeSearchSites(sites) === DEFAULT_SEARCHES;
    count.textContent = t('xlinks.editor.count', { count: sites.length });
  }

  render();
  return {
    control: root,
    sync(next: SettingValue) {
      sites = parseSearchSites(String(next));
      if (editing !== null && editing > sites.length) editing = null;
      render();
    },
  };
};
