import { DEFAULT_SETTINGS } from '../../../config/constants';
import { notifyLensDisplayChanged, notifyLensDisplayPreview } from '../../../services/lensImages';
import { saveSetting, state } from '../../../state/store';
import type { DownloaderSettings } from '../../../types';
import { el } from '../../../utils/dom';
import { button, field, input, label, select, separator, setSliderValue, setSwitch, slider, switchControl, tooltip, uid } from '../../kit';

type Key = keyof DownloaderSettings;

interface Control {
  key: Key;
  label: string;
  hint?: string;
  type: 'checkbox' | 'select' | 'range' | 'text';
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
const GROUPS: Array<{ title: string; controls: Control[] }> = [
  {
    title: 'Paragraphs',
    controls: [
      { key: 'imageTranslateReflow', label: 'Re-wrap horizontal text', type: 'checkbox', hint: 'Lay each paragraph out as one text area instead of repeating the lines Lens found. The settings below need it for horizontal text' },
      { key: 'imageTranslateAlign', label: 'Alignment', type: 'select', reflows: true, options: [['auto', 'Follow the source'], ['left', 'Left'], ['center', 'Center'], ['right', 'Right']] },
      { key: 'imageTranslateLineSpacing', label: 'Line spacing', type: 'range', min: 0.8, max: 2, step: 0.05, unit: 'x', reflows: true },
      { key: 'imageTranslateFitToBox', label: 'Keep text out of the next bubble', type: 'checkbox', reflows: true, hint: 'Shrink a paragraph that outgrows the room between its neighbours, down to the minimum size' }
    ]
  },
  {
    title: 'Manga & vertical text',
    controls: [
      { key: 'imageTranslateManga', label: 'Manga mode', type: 'checkbox', hint: 'Always re-wrap vertical text, cover it instead of patching, widen its room, raise the minimum size' },
      { key: 'imageTranslateMangaGrowth', label: 'Bubble fill', type: 'range', min: 1, max: 2.5, step: 0.05, unit: 'x', hint: 'How far past the detected text a re-wrapped paragraph may spread', activeWhen: manga },
      {
        key: 'imageTranslateVertical', label: 'Vertical CJK text', type: 'select',
        options: [['auto', 'Vertical for CJK targets only'], ['keep', 'Always vertical'], ['horizontal', 'Always horizontal']],
        hint: 'Manga mode always re-wraps', activeWhen: (settings) => !settings.imageTranslateManga
      }
    ]
  },
  {
    title: 'Erasing the original',
    controls: [
      { key: 'imageTranslateDrawBackground', label: 'Erase the original text', type: 'checkbox' },
      {
        key: 'imageTranslateErase', label: 'How', type: 'select', activeWhen: erasing, hint: 'Manga mode always covers',
        options: [['patch', "Lens's patches, like Chrome"], ['hull', 'Cover the text area with its background']]
      },
      {
        key: 'imageTranslateHullPadding', label: 'Cover margin', type: 'range', min: 0, max: 2, step: 0.05,
        hint: 'How far past the text the cover reaches, in line heights',
        activeWhen: (settings) => erasing(settings) && (settings.imageTranslateErase === 'hull' || settings.imageTranslateManga)
      }
    ]
  },
  {
    title: 'Text',
    controls: [
      { key: 'imageTranslateFont', label: 'Font', type: 'text', hint: 'A CSS font family; blank uses the system font' },
      {
        key: 'imageTranslateOutline', label: 'Outline', type: 'range', min: 0, max: 8, step: 0.1, unit: 'x',
        hint: 'Thickens the outline in the background colour behind the text; 0 removes it. Lines drawn without erasing have none',
        activeWhen: (settings) => erasing(settings) || settings.imageTranslateReflow || settings.imageTranslateManga
      },
      { key: 'imageTranslateMinPx', label: 'Minimum size', type: 'range', min: 0, max: 32, step: 1, unit: 'px', hint: 'The smallest the text may be on screen when the viewer fits the picture; 0 turns it off. Text kept at this size may spill past its bubble' },
      { key: 'imageTranslateSharpness', label: 'Sharpness', type: 'select', options: [['1', '1x'], ['2', '2x'], ['3', '3x']], hint: 'Renders at this multiple of the image size, so zooming in stays crisp' }
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
    if (control.hint) tooltip(row, { text: control.hint, side: 'left' });
    return row;
  };

  const buildRow = (control: Control): HTMLElement => {
    const numeric = typeof DEFAULT_SETTINGS[control.key] === 'number';
    const parse = (raw: string): unknown => (numeric ? parseFloat(raw) : raw);

    if (control.type === 'checkbox') {
      const toggle = switchControl({ onChange: (checked) => set(control.key, checked) });
      const row = field({ label: control.label, control: toggle, orientation: 'horizontal', className: 'kui-lens-row kui-lens-row--check' });
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
      const row = el('div', { className: 'kui-lens-row kui-lens-row--range' }, [label({ text: control.label, htmlFor: id }), range]);
      rows.push({ control, row, sync: () => setSliderValue(range, Number(readSetting(control.key))) });
      return withHint(row, control);
    }

    const box = control.type === 'select'
      ? select({
          options: (control.options ?? []).map(([value, text]) => ({ value, label: text })),
          onChange: (value) => set(control.key, parse(value)),
        })
      : input({ placeholder: 'system-ui', onInput: (value) => set(control.key, value) });
    const row = field({ label: control.label, control: box, className: 'kui-lens-row' });
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
      el('strong', {}, ['Translation display']),
      iconButton('rotate-ccw', 'Back to defaults', () => {
        CONTROLS.forEach((control) => set(control.key, DEFAULT_SETTINGS[control.key], false));
        syncAll();
      }),
      iconButton('x', 'Close', onClose),
    ]),
    ...GROUPS.map((group, index) => el('section', { className: 'kui-lens-group' }, [
      index ? separator() : null,
      el('h4', {}, [group.title]),
      ...group.controls.map(buildRow),
    ])),
  ]);
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Translation display');
  syncAll();
  return panel;
}
