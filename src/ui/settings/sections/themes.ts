import { getModuleSetting, setModuleSetting } from '../../../core/registry';
import type { PageType, SiteId } from '../../../core/types';
import {
  createTheme,
  deleteTheme,
  duplicateTheme,
  exportAllJson,
  exportThemeJson,
  getTheme,
  getThemes,
  importThemesJson,
  MAX_THEME_BYTES,
  saveTheme,
  setThemeEnabled,
  ThemeError,
  themeSize,
} from '../../../modules/restyle/store';
import { getTransformErrors } from '../../../modules/restyle/transforms';
import { PAGE_TYPES, SITE_IDS, TRANSFORM_ACTIONS, type Theme, type Transform, type TransformAction } from '../../../modules/restyle/types';
import { THEME_VARS } from '../../../modules/restyle/vars';
import { el } from '../../../utils/dom';
import { saveBlob } from '../../../utils/saveFile';
import { css } from '../../../utils/cssBuilder';
import { badge, button, checkbox, emptyState, field, getKitRoot, input, select, setSwitch, switchControl, textarea, toast } from '../../kit';
import { notifySaved, section, switchRow, whileConnected } from '../controls';
import { registerSettingsSection } from '../registry';
import { peekButton, themeDescription, themeName, themePreviewStyles, themeThumbnail } from '../themePreview';
import { t, tx, type UiKey } from '../../../i18n';
import './shadcnSwatches';

const STYLE_ID = 'kdl-themes-styles';
const PREVIEW_DEBOUNCE_MS = 400;

const ACTION_HINTS: Record<TransformAction, UiKey> = {
  hide: 'themes.transform.hint.hide',
  remove: 'themes.transform.hint.remove',
  addClass: 'themes.transform.hint.addClass',
  setAttr: 'themes.transform.hint.setAttr',
  moveBefore: 'themes.transform.hint.target',
  moveInto: 'themes.transform.hint.target',
  wrap: 'themes.transform.hint.wrap',
  setText: 'themes.transform.hint.setText',
  sticky: 'themes.transform.hint.sticky',
};

const styles = css({
  '.kdl-themes__toolbar': { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  '.kdl-themes__list': { display: 'flex', flexDirection: 'column', gap: '2px' },
  '.kdl-themes__row': {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
  },
  '.kdl-themes__row:hover': { background: 'var(--kdl-muted)' },
  '.kdl-themes__row > .kdl-tp-figure': { alignSelf: 'flex-start' },
  '.kdl-themes__preview': { display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' },
  '.kdl-themes__preview-note': { fontSize: '12px', lineHeight: 1.4, color: 'var(--kdl-muted-foreground)', maxWidth: '36ch' },
  '.kdl-themes__info': { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  '.kdl-themes__name': { fontSize: '14px', fontWeight: 500, display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
  '.kdl-themes__meta': { fontSize: '12px', color: 'var(--kdl-muted-foreground)', lineHeight: 1.4 },
  '.kdl-themes__actions': { display: 'flex', gap: '4px', flexShrink: 0 },
  '.kdl-themes__checks': { display: 'flex', flexWrap: 'wrap', gap: '6px 14px' },
  '.kdl-themes__check': { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' },
  '.kdl-themes__vars': { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  '.kdl-themes__var': { display: 'flex', gap: '6px', alignItems: 'center' },
  '.kdl-themes__var .kdl-ui-input': { flex: '1 1 auto', minWidth: 0 },
  '.kdl-themes__color': {
    flex: '0 0 36px',
    width: '36px',
    height: '36px',
    padding: '2px',
    border: '1px solid var(--kdl-input)',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'transparent',
    cursor: 'pointer',
  },
  '.kdl-themes__code': {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: '12.5px',
    lineHeight: 1.5,
    tabSize: 2,
    whiteSpace: 'pre',
    minHeight: '220px',
  },
  '.kdl-themes__transform': {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) 130px minmax(0, 1.5fr) minmax(0, 1fr) auto',
    gap: '6px',
    alignItems: 'center',
  },
  '.kdl-themes__status': { fontSize: '12px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-themes__status[data-error]': { color: 'var(--kdl-danger)' },
  '.kdl-themes__warning': { fontSize: '12px', lineHeight: 1.4, color: 'var(--kdl-warning)' },
  '.kdl-themes__errors': { fontSize: '12px', color: 'var(--kdl-danger)', display: 'flex', flexDirection: 'column', gap: '2px' },
  '@media (max-width: 640px)': {
    '.kdl-themes__transform': { gridTemplateColumns: '1fr 1fr' },
    '.kdl-themes__row': { flexWrap: 'wrap', alignItems: 'flex-start' },
    // Switch + text on the first line, the sketch and the buttons under it
    '.kdl-themes__info': { flex: '1 1 calc(100% - 60px)' },
    '.kdl-themes__row > .kdl-tp-figure': { order: 3, marginLeft: '48px' },
    '.kdl-themes__actions': { order: 4, marginLeft: 'auto', alignSelf: 'flex-end' },
  },
});

function ensureStyles(): void {
  const root = getKitRoot();
  if (root.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = styles + themePreviewStyles;
  root.appendChild(style);
}

const fileName = (name: string) => `kdl-theme-${name.toLowerCase().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'theme'}.json`;

function download(json: string, name: string): void {
  saveBlob(new Blob([json], { type: 'application/json' }), name);
}

/** Page types read as in the Modules tab ("Post lists", "Creator"...) */
const pageLabel = (page: string): string => tx(`settings.modules.page.${page}`, page);

function scopeLabel(theme: Theme): string {
  const sites = theme.sites === 'any' ? t('themes.scope.allSites') : theme.sites.join(', ');
  const pages = theme.pages === 'any' ? t('themes.scope.allPages') : theme.pages.map(pageLabel).join(', ');
  return `${sites} · ${pages}`;
}

function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  toast({ title: t('themes.error'), description: message, variant: 'destructive' });
  if (!(error instanceof ThemeError)) console.error('[KDL:restyle]', error);
}

/** Textarea for code: monospace, Tab inserts two spaces (Shift+Tab still leaves the field) */
function codeArea(value: string, onInput: (value: string) => void, rows = 14): HTMLTextAreaElement {
  const area = textarea({ value, rows, className: 'kdl-themes__code', onInput: (v) => onInput(v) });
  area.spellcheck = false;
  area.setAttribute('autocapitalize', 'off');
  area.setAttribute('autocomplete', 'off');
  area.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
    area.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return area;
}

function pickFile(onText: (text: string) => void): void {
  const picker = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
  picker.addEventListener('change', async () => {
    const file = picker.files?.[0];
    picker.remove();
    if (file) onText(await file.text());
  });
  getKitRoot().appendChild(picker);
  picker.click();
}

// --- List view ------------------------------------------------------------------------------

function themeRow(theme: Theme, open: (id: string | null) => void): HTMLElement {
  const builtin = theme.origin === 'builtin';
  const name = themeName(theme);
  const description = themeDescription(theme);
  const actions: HTMLElement[] = [peekButton(theme)];
  if (!builtin) actions.push(button({ icon: 'settings', variant: 'ghost', size: 'icon', ariaLabel: t('themes.action.editNamed', { name }), title: t('themes.action.edit'), onClick: () => open(theme.id) }));
  actions.push(
    button({
      icon: 'copy',
      variant: 'ghost',
      size: 'icon',
      ariaLabel: t('themes.action.duplicateNamed', { name }),
      title: builtin ? t('themes.action.duplicateToEdit') : t('themes.action.duplicate'),
      onClick: () => {
        try {
          const copy = duplicateTheme(theme.id);
          if (copy) open(copy.id);
        } catch (error) {
          showError(error);
        }
      },
    }),
    button({ icon: 'download', variant: 'ghost', size: 'icon', ariaLabel: t('themes.action.exportNamed', { name }), title: t('themes.action.export'), onClick: () => download(exportThemeJson(theme), fileName(theme.name)) })
  );
  if (!builtin) {
    actions.push(
      button({
        icon: 'x',
        variant: 'ghost',
        size: 'icon',
        ariaLabel: t('themes.action.deleteNamed', { name }),
        title: t('themes.action.delete'),
        onClick: () => {
          if (!confirm(t('themes.delete.confirm', { name }))) return;
          deleteTheme(theme.id);
          open(null);
        },
      })
    );
  }
  const tags = [
    builtin ? badge({ text: t('themes.badge.preset'), variant: 'secondary' }) : null,
    theme.origin === 'import' ? badge({ text: t('themes.badge.imported'), variant: 'outline' }) : null,
    theme.script ? badge({ text: t('themes.badge.script'), variant: 'warning' }) : null,
  ];
  return el('div', { className: 'kdl-themes__row', dataset: { theme: theme.id } }, [
    switchControl({ checked: theme.enabled, ariaLabel: t('themes.action.enableNamed', { name }), onChange: (on) => setThemeEnabled(theme.id, on) }),
    themeThumbnail(theme),
    el('div', { className: 'kdl-themes__info' }, [
      el('div', { className: 'kdl-themes__name' }, [name, ...tags]),
      el('div', { className: 'kdl-themes__meta', textContent: description ? `${description} (${scopeLabel(theme)})` : scopeLabel(theme) }),
    ]),
    el('div', { className: 'kdl-themes__actions' }, actions),
  ]);
}

function listView(open: (id: string | null) => void): HTMLElement[] {
  const themes = getThemes();
  const presets = themes.filter((t) => t.origin === 'builtin');
  const own = themes.filter((t) => t.origin !== 'builtin');

  const toolbar = el('div', { className: 'kdl-themes__toolbar' }, [
    button({ id: 'kdl-themes-new', label: t('themes.new'), icon: 'file', onClick: () => open(createTheme().id) }),
    button({
      label: t('themes.import'),
      icon: 'folder-open',
      variant: 'secondary',
      onClick: () =>
        pickFile((text) => {
          try {
            const imported = importThemesJson(text);
            toast({ title: t('themes.import.done', { count: imported.length }), description: t('themes.import.disabled'), variant: 'success' });
            open(null);
          } catch (error) {
            showError(error);
          }
        }),
    }),
    button({
      label: t('themes.exportAll'),
      icon: 'download',
      variant: 'secondary',
      disabled: !own.length,
      onClick: () => download(exportAllJson(), 'kdl-themes.json'),
    }),
  ]);

  const ownList = own.length
    ? el('div', { className: 'kdl-themes__list' }, own.map((t) => themeRow(t, open)))
    : emptyState({ icon: 'sliders-horizontal', title: t('themes.empty.title'), description: t('themes.empty.description') });

  const allowScripts = switchRow({
    id: 'kdl-themes-allow-scripts',
    label: tx('mod.restyle.setting.allowScripts', 'Allow theme scripts'),
    description: tx('mod.restyle.setting.allowScripts.hint', 'Runs the Script field of themes created in this browser. Imported themes never carry scripts.'),
    checked: getModuleSetting<boolean>('restyle', 'allowScripts') === true,
    onChange: (on) => {
      setModuleSetting('restyle', 'allowScripts', on);
      notifySaved();
    },
  });
  whileConnected(allowScripts, (event) => {
    if (event.type === 'setting' && event.id === 'restyle' && event.key === 'allowScripts') {
      setSwitch(allowScripts.querySelector<HTMLElement>('[role="switch"]')!, Boolean(event.value));
    }
  });

  return [
    section(t('themes.own.title'), [toolbar, ownList], {
      icon: 'sliders-horizontal',
      description: t('themes.own.description'),
    }),
    section(t('themes.presets.title'), [el('div', { className: 'kdl-themes__list' }, presets.map((p) => themeRow(p, open)))], {
      icon: 'layout-grid',
      description: t('themes.presets.description'),
    }),
    section(t('themes.scripts.title'), [
      allowScripts,
      el('p', {
        className: 'kdl-themes__warning',
        textContent: t('themes.scripts.warning'),
      }),
    ], { icon: 'triangle-alert' }),
  ];
}

// --- Editor ---------------------------------------------------------------------------------

function checkGroup<T extends string>(all: readonly T[], selected: T[] | 'any', onChange: (value: T[] | 'any') => void, label: (value: T) => string = (v) => v): HTMLElement {
  const chosen = new Set(selected === 'any' ? [] : selected);
  return el(
    'div',
    { className: 'kdl-themes__checks' },
    all.map((value) =>
      el('label', { className: 'kdl-themes__check' }, [
        checkbox({
          checked: chosen.has(value),
          onChange: (on) => {
            if (on) chosen.add(value);
            else chosen.delete(value);
            onChange(chosen.size ? all.filter((v) => chosen.has(v)) : 'any');
          },
        }),
        label(value),
      ])
    )
  );
}

const HEX = /^#[0-9a-f]{6}$/i;
const toHex = (value: string): string => {
  if (HEX.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).replace(/./g, (c) => c + c)}`;
  return '#000000';
};

function varsEditor(draft: Theme, changed: () => void): HTMLElement {
  const setVar = (name: string, value: string) => {
    if (value.trim()) draft.vars[name] = value.trim();
    else delete draft.vars[name];
    changed();
  };
  return el(
    'div',
    { className: 'kdl-themes__vars' },
    THEME_VARS.map((def) => {
      const text = input({
        value: draft.vars[def.name] ?? '',
        placeholder: def.kind === 'color' ? t('themes.var.unset') : def.placeholder ?? t('themes.var.unset'),
        ariaLabel: t(def.label),
        onInput: (v) => {
          if (picker) picker.value = toHex(v.trim());
          setVar(def.name, v);
        },
      });
      let picker: HTMLInputElement | null = null;
      if (def.kind === 'color') {
        picker = el('input', { type: 'color', className: 'kdl-themes__color', value: toHex(draft.vars[def.name] ?? '') });
        picker.setAttribute('aria-label', t('themes.var.colourOf', { name: t(def.label) }));
        picker.addEventListener('input', () => {
          text.value = picker!.value;
          setVar(def.name, picker!.value);
        });
      }
      return field({ label: t(def.label), description: def.name, control: el('div', { className: 'kdl-themes__var' }, [picker, text]) });
    })
  );
}

function transformsEditor(draft: Theme, changed: () => void): HTMLElement {
  const wrap = el('div', { className: 'kdl-settings__group' });
  const render = () => {
    const rows = draft.transforms.map((tr, index) => {
      const update = (patch: Partial<Transform>) => {
        draft.transforms[index] = { ...draft.transforms[index], ...patch };
        changed();
      };
      const argInput = input({ value: tr.arg ?? '', placeholder: t(ACTION_HINTS[tr.action]), ariaLabel: t('themes.transform.argument'), onInput: (v) => update({ arg: v || undefined }) });
      return el('div', { className: 'kdl-themes__transform' }, [
        input({ value: tr.selector, placeholder: t('themes.transform.selector.placeholder'), ariaLabel: t('themes.transform.selector'), onInput: (v) => update({ selector: v }) }),
        select({
          value: tr.action,
          ariaLabel: t('themes.transform.action'),
          options: TRANSFORM_ACTIONS,
          onChange: (v) => {
            update({ action: v as TransformAction });
            argInput.placeholder = t(ACTION_HINTS[v as TransformAction]);
          },
        }),
        argInput,
        input({
          value: tr.pages?.join(', ') ?? '',
          placeholder: t('themes.transform.pages.placeholder'),
          ariaLabel: t('themes.transform.pages'),
          onChange: (v) => {
            const pages = v.split(/[\s,]+/).filter((p): p is PageType => PAGE_TYPES.includes(p as PageType));
            update({ pages: pages.length ? pages : undefined });
          },
        }),
        button({
          icon: 'x',
          variant: 'ghost',
          size: 'icon',
          ariaLabel: t('themes.transform.remove'),
          onClick: () => {
            draft.transforms.splice(index, 1);
            changed();
            render();
          },
        }),
      ]);
    });
    wrap.replaceChildren(
      ...rows,
      el('div', { className: 'kdl-themes__toolbar' }, [
        button({
          label: t('themes.transform.add'),
          icon: 'check',
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            draft.transforms.push({ selector: '', action: 'hide' });
            render();
          },
        }),
      ])
    );
  };
  render();
  return wrap;
}

function editorView(theme: Theme, open: (id: string | null) => void): HTMLElement[] {
  const draft: Theme = JSON.parse(JSON.stringify(theme));
  const status = el('span', { className: 'kdl-themes__status' });
  const errors = el('div', { className: 'kdl-themes__errors' });
  let timer = 0;

  const showStatus = () => {
    const size = themeSize(draft);
    status.textContent = t('themes.size', { size: (size / 1024).toFixed(1), max: MAX_THEME_BYTES / 1024 });
    delete status.dataset.error;
  };
  const save = () => {
    try {
      saveTheme(draft);
      showStatus();
      // Transform errors come from the sync that saving triggers
      errors.replaceChildren(...getTransformErrors(draft.id).map((m) => el('span', { textContent: m })));
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error);
      status.dataset.error = '';
    }
  };
  const preview = el('div', { className: 'kdl-themes__preview' });
  const drawPreview = () =>
    preview.replaceChildren(
      themeThumbnail(draft),
      el('p', {
        className: 'kdl-themes__preview-note',
        textContent: t('themes.preview.note'),
      })
    );
  drawPreview();
  // Live preview: every edit is saved (and applied) after a short pause
  const changed = () => {
    drawPreview();
    clearTimeout(timer);
    timer = window.setTimeout(save, PREVIEW_DEBOUNCE_MS);
  };
  showStatus();

  const head = el('div', { className: 'kdl-themes__toolbar' }, [
    button({
      label: t('themes.back'),
      icon: 'chevron-left',
      variant: 'outline',
      size: 'sm',
      onClick: () => {
        clearTimeout(timer);
        save();
        open(null);
      },
    }),
    el('span', { className: 'kdl-settings__footer-spacer' }),
    button({ label: t('themes.action.export'), icon: 'download', variant: 'secondary', size: 'sm', onClick: () => download(exportThemeJson(draft), fileName(draft.name)) }),
    button({
      label: t('themes.action.delete'),
      icon: 'x',
      variant: 'destructive',
      size: 'sm',
      onClick: () => {
        if (!confirm(t('themes.delete.confirm', { name: draft.name }))) return;
        clearTimeout(timer);
        deleteTheme(draft.id);
        open(null);
      },
    }),
  ]);

  const general = section(t('themes.editor.title'), [
    head,
    field({
      label: t('themes.editor.name'),
      control: input({ id: 'kdl-theme-name', value: draft.name, onInput: (v) => ((draft.name = v), changed()) }),
    }),
    preview,
    switchRow({ label: t('themes.editor.enabled'), checked: draft.enabled, onChange: (on) => ((draft.enabled = on), changed()) }),
    field({ label: t('themes.editor.sites'), description: t('themes.editor.sites.hint'), control: checkGroup<SiteId>(SITE_IDS, draft.sites, (v) => ((draft.sites = v), changed())) }),
    field({ label: t('themes.editor.pages'), description: t('themes.editor.pages.hint'), control: checkGroup<PageType>(PAGE_TYPES, draft.pages, (v) => ((draft.pages = v), changed()), pageLabel) }),
    status,
  ], { icon: 'settings' });

  const colours = section(t('themes.editor.vars'), [varsEditor(draft, changed)], {
    icon: 'sliders-horizontal',
    description: t('themes.editor.vars.hint'),
  });

  const cssSection = section('CSS', [
    codeArea(draft.css, (v) => ((draft.css = v), changed())),
    el('p', {
      className: 'kdl-settings__note',
      textContent: t('themes.editor.css.note'),
    }),
  ], { icon: 'file' });

  const transforms = section(t('themes.editor.transforms'), [transformsEditor(draft, changed), errors], {
    icon: 'layout-grid',
    description: t('themes.editor.transforms.hint'),
  });

  const out = [general, colours, cssSection, transforms];
  if (draft.origin === 'local') {
    const allowed = getModuleSetting<boolean>('restyle', 'allowScripts') === true;
    out.push(
      section(t('themes.editor.script'), [
        codeArea(draft.script ?? '', (v) => ((draft.script = v), changed()), 8),
        el('p', {
          className: 'kdl-themes__warning',
          textContent: (allowed ? `${t('themes.editor.script.off')} ` : '') + t('themes.editor.script.note'),
        }),
      ], { icon: 'triangle-alert' })
    );
  }
  return out;
}

registerSettingsSection({
  id: 'themes',
  title: 'Themes',
  icon: 'sliders-horizontal',
  order: 55,
  render(container) {
    ensureStyles();
    const open = (id: string | null) => {
      const theme = id ? getTheme(id) : undefined;
      container.replaceChildren(...(theme && theme.origin !== 'builtin' ? editorView(theme, open) : listView(open)));
      container.closest('.kdl-ui-tabs__panel')?.scrollTo?.({ top: 0 });
    };
    open(null);
  },
});
