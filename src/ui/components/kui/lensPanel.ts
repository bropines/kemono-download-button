import { DEFAULT_SETTINGS } from '../../../config/constants';
import { notifyLensDisplayChanged, notifyLensDisplayPreview } from '../../../services/lensImages';
import { saveSetting, state } from '../../../state/store';
import type { DownloaderSettings } from '../../../types';
import { el } from '../../../utils/dom';
import { t, tx, type UiKey } from '../../../i18n';
import { button, field, input, label, select, separator, setSliderValue, setSwitch, slider, switchControl, tooltip, uid } from '../../kit';

type Key = keyof DownloaderSettings;

interface Control {
  key: Key;
  label: UiKey;
  hint?: UiKey;
  type: 'checkbox' | 'select' | 'range' | 'text';
  // [value, text key]; a literal like '1x' is shown as is
  options?: Array<[string, string]>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // Dimmed while it has no effect on the picture
  activeWhen?: (settings: DownloaderSettings) => boolean;
  // Acts on re-wrapped paragraphs only, so changing it switches horizontal re-wrapping on
  reflows?: boolean;
}

const manga = (settings: DownloaderSettings) => settings.imageTranslateManga;
const erasing = (settings: DownloaderSettings) => settings.imageTranslateDrawBackground;

// The display settings of the Lens engine (chrome-lens-userscript's settings.ts), grouped by what they act on.
// Horizontal text is drawn line by line in the boxes Lens found unless it is re-wrapped, and only a
// re-wrapped paragraph has a spacing, an alignment or a room to fit: those controls switch re-wrapping on.
// Vertical text is re-wrapped anyway, unless it is kept vertical.
const GROUPS: Array<{ title: UiKey; controls: Control[] }> = [
  {
    title: 'kui.lensPanel.group.paragraphs',
    controls: [
      { key: 'imageTranslateReflow', label: 'kui.lensPanel.reflow', type: 'checkbox', hint: 'kui.lensPanel.reflow.hint' },
      { key: 'imageTranslateAlign', label: 'kui.lensPanel.align', type: 'select', reflows: true, options: [['auto', 'kui.lensPanel.align.option.auto'], ['left', 'kui.lensPanel.align.option.left'], ['center', 'kui.lensPanel.align.option.center'], ['right', 'kui.lensPanel.align.option.right']] },
      { key: 'imageTranslateLineSpacing', label: 'kui.lensPanel.lineSpacing', type: 'range', min: 0.8, max: 2, step: 0.05, unit: 'x', reflows: true },
      { key: 'imageTranslateFitToBox', label: 'kui.lensPanel.fitToBox', type: 'checkbox', reflows: true, hint: 'kui.lensPanel.fitToBox.hint' }
    ]
  },
  {
    title: 'kui.lensPanel.group.manga',
    controls: [
      { key: 'imageTranslateManga', label: 'kui.lensPanel.manga', type: 'checkbox', hint: 'kui.lensPanel.manga.hint' },
      { key: 'imageTranslateMangaGrowth', label: 'kui.lensPanel.mangaGrowth', type: 'range', min: 1, max: 2.5, step: 0.05, unit: 'x', hint: 'kui.lensPanel.mangaGrowth.hint', activeWhen: manga },
      {
        key: 'imageTranslateVertical', label: 'kui.lensPanel.vertical', type: 'select',
        options: [['auto', 'kui.lensPanel.vertical.option.auto'], ['keep', 'kui.lensPanel.vertical.option.keep'], ['horizontal', 'kui.lensPanel.vertical.option.horizontal']],
        hint: 'kui.lensPanel.vertical.hint', activeWhen: (settings) => !settings.imageTranslateManga
      }
    ]
  },
  {
    title: 'kui.lensPanel.group.erasing',
    controls: [
      { key: 'imageTranslateDrawBackground', label: 'kui.lensPanel.drawBackground', type: 'checkbox' },
      {
        key: 'imageTranslateErase', label: 'kui.lensPanel.erase', type: 'select', activeWhen: erasing, hint: 'kui.lensPanel.erase.hint',
        options: [['patch', 'kui.lensPanel.erase.option.patch'], ['hull', 'kui.lensPanel.erase.option.hull']]
      },
      {
        key: 'imageTranslateHullPadding', label: 'kui.lensPanel.hullPadding', type: 'range', min: 0, max: 2, step: 0.05,
        hint: 'kui.lensPanel.hullPadding.hint',
        activeWhen: (settings) => erasing(settings) && (settings.imageTranslateErase === 'hull' || settings.imageTranslateManga)
      }
    ]
  },
  {
    title: 'kui.lensPanel.group.text',
    controls: [
      { key: 'imageTranslateFont', label: 'kui.lensPanel.font', type: 'text', hint: 'kui.lensPanel.font.hint' },
      {
        key: 'imageTranslateOutline', label: 'kui.lensPanel.outline', type: 'range', min: 0, max: 8, step: 0.1, unit: 'x',
        hint: 'kui.lensPanel.outline.hint',
        activeWhen: (settings) => erasing(settings) || settings.imageTranslateReflow || settings.imageTranslateManga
      },
      { key: 'imageTranslateMinPx', label: 'kui.lensPanel.minPx', type: 'range', min: 0, max: 32, step: 1, unit: 'px', hint: 'kui.lensPanel.minPx.hint' },
      { key: 'imageTranslateSharpness', label: 'kui.lensPanel.sharpness', type: 'select', options: [['1', '1x'], ['2', '2x'], ['3', '3x']], hint: 'kui.lensPanel.sharpness.hint' }
    ]
  }
];

const CONTROLS = GROUPS.flatMap((group) => group.controls);
// Saving and redrawing wait for a slider to settle rather than following every pixel of a drag
const SETTLE_MS = 200;

const readSetting = (key: Key): unknown => state.settings[key];

function formatValue(control: Control, value: unknown): string {
  const number = Number(value);
  const digits = (control.step ?? 1) < 0.1 ? 2 : (control.step ?? 1) < 1 ? 1 : 0;
  return `${number.toFixed(digits)}${control.unit ?? ''}`;
}

/** The translation display settings, for the image viewer. Every change redraws the translation on screen. */
export function createLensPanel(onClose: () => void): HTMLElement {
  const dirty = new Set<Key>();
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  const rows: Array<{ control: Control; row: HTMLElement; sync: () => void }> = [];

  const refreshActive = () => {
    rows.forEach(({ control, row }) => {
      row.classList.toggle('kui-lens-row--inactive', !!control.activeWhen && !control.activeWhen(state.settings));
    });
  };

  const commit = () => {
    dirty.forEach((key) => void saveSetting(key, state.settings[key] as never));
    dirty.clear();
    notifyLensDisplayChanged();
  };

  // `cascade` off for a reset, which sets re-wrapping itself and must not have it switched back on
  const set = (key: Key, value: unknown, cascade = true) => {
    const settings = state.settings as unknown as Record<string, unknown>;
    settings[key] = value;
    dirty.add(key);
    if (cascade && CONTROLS.find((control) => control.key === key)?.reflows && !state.settings.imageTranslateReflow) {
      settings.imageTranslateReflow = true;
      dirty.add('imageTranslateReflow');
      rows.find((row) => row.control.key === 'imageTranslateReflow')?.sync();
    }
    refreshActive();
    // The picture follows at once, as a draft; saving and the full-quality redraw wait for it to settle
    notifyLensDisplayPreview();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(commit, SETTLE_MS);
  };

  const withHint = (row: HTMLElement, control: Control): HTMLElement => {
    if (control.hint) tooltip(row, { text: t(control.hint), side: 'left' });
    return row;
  };

  const buildRow = (control: Control): HTMLElement => {
    const numeric = typeof DEFAULT_SETTINGS[control.key] === 'number';
    const parse = (raw: string): unknown => (numeric ? parseFloat(raw) : raw);

    if (control.type === 'checkbox') {
      const toggle = switchControl({ onChange: (checked) => set(control.key, checked) });
      const row = field({ label: t(control.label), control: toggle, orientation: 'horizontal', className: 'kui-lens-row kui-lens-row--check' });
      rows.push({ control, row, sync: () => setSwitch(toggle, Boolean(readSetting(control.key))) });
      return withHint(row, control);
    }

    if (control.type === 'range') {
      const id = uid('kui-lens');
      const range = slider({
        id,
        min: control.min,
        max: control.max,
        step: control.step,
        showValue: (value) => formatValue(control, value),
        onInput: (value) => set(control.key, parse(String(value))),
      });
      const row = el('div', { className: 'kui-lens-row kui-lens-row--range' }, [label({ text: t(control.label), htmlFor: id }), range]);
      rows.push({ control, row, sync: () => setSliderValue(range, Number(readSetting(control.key))) });
      return withHint(row, control);
    }

    const box = control.type === 'select'
      ? select({
          options: (control.options ?? []).map(([value, text]) => ({ value, label: tx(text, text) })),
          onChange: (value) => set(control.key, parse(value)),
        })
      : input({ placeholder: 'system-ui', onInput: (value) => set(control.key, value) });
    const row = field({ label: t(control.label), control: box, className: 'kui-lens-row' });
    rows.push({ control, row, sync: () => { box.value = String(readSetting(control.key)); } });
    return withHint(row, control);
  };

  const syncAll = () => {
    rows.forEach(({ sync }) => sync());
    refreshActive();
  };

  const iconButton = (iconName: 'rotate-ccw' | 'x', text: string, onClick: () => void) =>
    tooltip(button({ icon: iconName, variant: 'ghost', size: 'icon', ariaLabel: text, className: 'kui-lens-panel-btn', onClick }), { text });

  const panel = el('div', { className: 'kui-lens-panel' }, [
    el('div', { className: 'kui-lens-panel-header' }, [
      el('strong', {}, [t('kui.lensPanel.title')]),
      iconButton('rotate-ccw', t('kui.lensPanel.reset'), () => {
        CONTROLS.forEach((control) => set(control.key, DEFAULT_SETTINGS[control.key], false));
        syncAll();
      }),
      iconButton('x', t('kui.lensPanel.close'), onClose),
    ]),
    ...GROUPS.map((group, index) => el('section', { className: 'kui-lens-group' }, [
      index ? separator() : null,
      el('h4', {}, [t(group.title)]),
      ...group.controls.map(buildRow),
    ])),
  ]);
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', t('kui.lensPanel.title'));
  syncAll();
  return panel;
}
