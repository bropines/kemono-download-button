// Theme previews for the Themes tab: a mini mock of the site (sidebar, header, cards or a post) drawn
// with the theme's colour/radius/gap variables, a stylised version of what each structural preset does,
// and a hold-to-preview button that puts the theme on the real page while the dialog fades out.

import { compileTheme } from '../../modules/restyle/apply';
import { scopeSelector } from '../../modules/restyle/scopeCss';
import type { Theme } from '../../modules/restyle/types';
import { el } from '../../utils/dom';
import { button, getKitRoot, KIT_ROOT_ID } from '../kit';
import { t, tx, type UiKey } from '../../i18n';

type MockPage = 'grid' | 'post' | 'creator';
type Variant = 'dense' | 'rail' | 'compact-header' | 'reader' | 'creator-compact' | 'dim' | '';

const PRESET_VARIANTS: Record<string, { page: MockPage; variant: Variant; caption: UiKey }> = {
  'builtin-dense-grid': { page: 'grid', variant: 'dense', caption: 'themes.preview.caption.denseGrid' },
  'builtin-clutter-off': { page: 'grid', variant: 'rail', caption: 'themes.preview.caption.clutterOff' },
  'builtin-compact-header': { page: 'grid', variant: 'compact-header', caption: 'themes.preview.caption.compactHeader' },
  'builtin-reader': { page: 'post', variant: 'reader', caption: 'themes.preview.caption.reader' },
  'builtin-compact-creator': { page: 'creator', variant: 'creator-compact', caption: 'themes.preview.caption.compactCreator' },
  'builtin-dim-viewed': { page: 'grid', variant: 'dim', caption: 'themes.preview.caption.dimViewed' },
};

const DEFAULTS = {
  bg: ['--kdl-background', '--colour1-primary'],
  surface: ['--kdl-card', '--colour1-secondary'],
  text: ['--kdl-foreground', '--colour0-primary'],
  muted: ['--kdl-muted-foreground', '--colour0-secondary'],
  accent: ['--kdl-primary', '--anchour-colour1-primary'],
};
const FALLBACK = { bg: '#1d1f21', surface: '#282a2e', text: '#f0f0f0', muted: '#a0a0a0', accent: '#99ddff' };

/** The page's current look, so a theme that sets only some variables previews over the real rest */
function pageDefaults(): typeof FALLBACK {
  const style = getComputedStyle(document.documentElement);
  const shadcn = /\bshadcn\b/.test(document.documentElement.getAttribute('data-kdl-ui') || '');
  const pick = (names: string[], fallback: string) => {
    for (const name of shadcn ? names : names.slice(1)) {
      const value = style.getPropertyValue(name).trim();
      if (value) return value;
    }
    return fallback;
  };
  return {
    bg: pick(DEFAULTS.bg, FALLBACK.bg),
    surface: pick(DEFAULTS.surface, FALLBACK.surface),
    text: pick(DEFAULTS.text, FALLBACK.text),
    muted: pick(DEFAULTS.muted, FALLBACK.muted),
    accent: pick(DEFAULTS.accent, FALLBACK.accent),
  };
}

/** A length scaled down to the mock (a 1200px page drawn ~160px wide) */
function scaled(value: string | undefined, factor: number, max: number): string | null {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)(px|rem|em)?$/);
  if (!match) return null;
  const px = Number(match[1]) * (match[2] === 'rem' || match[2] === 'em' ? 16 : 1);
  return `${Math.min(max, Math.max(0, px * factor)).toFixed(1)}px`;
}

function mockFor(theme: Theme): { page: MockPage; variant: Variant; caption: string } {
  const preset = PRESET_VARIANTS[theme.id];
  if (preset) return { ...preset, caption: t(preset.caption) };
  const pages = theme.pages === 'any' ? [] : theme.pages;
  if (pages.length && pages.every((p) => p === 'post')) return { page: 'post', variant: '', caption: '' };
  if (pages.length && pages.every((p) => p === 'creator')) return { page: 'creator', variant: '', caption: '' };
  return { page: 'grid', variant: '', caption: '' };
}

const bar = (cls: string) => el('i', { className: cls });

function cards(count: number, variant: Variant): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => {
    const viewed = variant === 'dim' && (i % 3 === 1 || i === 4);
    return el('span', { className: `kdl-tp__card${viewed ? ' kdl-tp__card--viewed' : ''}` }, [bar('kdl-tp__thumb'), bar('kdl-tp__line')]);
  });
}

function body(page: MockPage, variant: Variant): HTMLElement {
  if (page === 'post') {
    return el('span', { className: 'kdl-tp__post' }, [
      bar('kdl-tp__title'),
      bar('kdl-tp__image'),
      bar('kdl-tp__text'),
      bar('kdl-tp__text kdl-tp__text--short'),
      bar('kdl-tp__text'),
      el('span', { className: 'kdl-tp__comments' }, [bar('kdl-tp__comment'), bar('kdl-tp__comment'), bar('kdl-tp__comment')]),
    ]);
  }
  if (page === 'creator') {
    return el('span', { className: 'kdl-tp__creator' }, [
      el('span', { className: 'kdl-tp__profile' }, [bar('kdl-tp__banner'), bar('kdl-tp__avatar'), bar('kdl-tp__name')]),
      el('span', { className: 'kdl-tp__tabs' }, [bar('kdl-tp__tab kdl-tp__tab--active'), bar('kdl-tp__tab'), bar('kdl-tp__tab')]),
      el('span', { className: 'kdl-tp__grid' }, cards(4, variant)),
    ]);
  }
  return el('span', { className: 'kdl-tp__grid' }, cards(variant === 'dense' ? 15 : 8, variant));
}

/** Mini mock of the site in the theme's look; `theme.vars` drive the colours, radius and gaps */
export function themeThumbnail(theme: Theme): HTMLElement {
  const { page, variant, caption } = mockFor(theme);
  const base = pageDefaults();
  const v = theme.vars;
  const frame = el('span', { className: 'kdl-tp', dataset: { page, variant: variant || 'none' } }, [
    el('span', { className: 'kdl-tp__side' }, [bar('kdl-tp__logo'), bar('kdl-tp__nav'), bar('kdl-tp__nav'), bar('kdl-tp__nav'), bar('kdl-tp__nav kdl-tp__nav--promo')]),
    el('span', { className: 'kdl-tp__main' }, [
      el('span', { className: 'kdl-tp__head' }, [bar('kdl-tp__crumb'), bar('kdl-tp__button')]),
      bar('kdl-tp__notice'),
      body(page, variant),
      bar('kdl-tp__foot'),
    ]),
  ]);
  frame.setAttribute('aria-hidden', 'true');
  const set = (name: string, value: string | null | undefined) => value && frame.style.setProperty(name, value);
  set('--tp-bg', v['--kdl-site-bg'] || base.bg);
  set('--tp-surface', v['--kdl-site-surface'] || base.surface);
  set('--tp-text', v['--kdl-site-text'] || base.text);
  set('--tp-muted', v['--kdl-site-muted'] || v['--kdl-site-text'] || base.muted);
  set('--tp-accent', v['--kdl-site-accent'] || base.accent);
  set('--tp-radius', scaled(v['--kdl-radius'], 0.4, 6));
  set('--tp-gap', scaled(v['--kdl-grid-gap'], 0.35, 6));
  if (v['--kdl-font']) frame.style.fontFamily = v['--kdl-font'];
  const figure = el('span', { className: 'kdl-tp-figure' }, [frame]);
  if (caption) figure.append(el('span', { className: 'kdl-tp-figure__caption', textContent: caption }));
  return figure;
}

// ---- hold to preview -----------------------------------------------------------------------

const PEEK_STYLE_ID = 'kdl-peek-theme';
const PEEK_CLASS = 'kdl-peek';
let peekHint: HTMLElement | null = null;

/** Built-in presets are translated (`themes.preset.<id>.name`); user themes keep their own name */
export function themeName(theme: Theme): string {
  return theme.origin === 'builtin' ? tx(`themes.preset.${theme.id}.name`, theme.name) : theme.name;
}

export function themeDescription(theme: Theme): string {
  return theme.origin === 'builtin' ? tx(`themes.preset.${theme.id}.description`, theme.description ?? '') : theme.description ?? '';
}

export function themeAppliesHere(theme: Theme): boolean {
  try {
    return document.documentElement.matches(scopeSelector(theme.sites, theme.pages));
  } catch {
    return false;
  }
}

function startPeek(theme: Theme): void {
  let style = document.getElementById(PEEK_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = PEEK_STYLE_ID;
  }
  // Own id: never collides with the theme's live <style> or the compile cache entry of the real theme
  style.textContent = compileTheme({ ...theme, id: `peek-${theme.id}`, enabled: true });
  (document.head || document.documentElement).appendChild(style);
  document.getElementById(KIT_ROOT_ID)?.classList.add(PEEK_CLASS);
  peekHint?.remove();
  peekHint = el('div', { className: 'kdl-tp-peek-hint', textContent: t('themes.peek.hint', { name: themeName(theme) }) });
  getKitRoot().appendChild(peekHint);
}

export function stopPeek(): void {
  document.getElementById(PEEK_STYLE_ID)?.remove();
  document.getElementById(KIT_ROOT_ID)?.classList.remove(PEEK_CLASS);
  peekHint?.remove();
  peekHint = null;
}

/** Eye button: press and hold (mouse, touch, Space/Enter) to see the page with the theme */
export function peekButton(theme: Theme): HTMLButtonElement {
  const applies = themeAppliesHere(theme);
  const btn = button({
    icon: 'eye',
    variant: 'ghost',
    size: 'icon',
    ariaLabel: t('themes.peek.label', { name: themeName(theme) }),
    title: applies ? t('themes.peek.title') : t('themes.peek.notHere'),
    disabled: !applies,
    className: 'kdl-tp-peek',
  });
  let active = false;
  const start = () => {
    if (active || btn.disabled) return;
    active = true;
    btn.setAttribute('aria-pressed', 'true');
    startPeek(theme);
  };
  const stop = () => {
    if (!active) return;
    active = false;
    btn.setAttribute('aria-pressed', 'false');
    stopPeek();
  };
  btn.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    btn.setPointerCapture?.(event.pointerId);
    start();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach((type) => btn.addEventListener(type, stop));
  btn.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      start();
    }
  });
  btn.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') stop();
  });
  // Long-press on touch would open the context menu
  btn.addEventListener('contextmenu', (event) => event.preventDefault());
  return btn;
}

// ---- styles (shadow root) ------------------------------------------------------------------

export const themePreviewStyles = `
:host(.${PEEK_CLASS}) .kdl-ui-dialog, :host(.${PEEK_CLASS}) .kdl-ui-overlay { opacity: 0 !important; transition: opacity 0.15s ease; }
.kdl-tp-peek-hint {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 300;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid var(--kdl-border);
  background: var(--kdl-popover);
  color: var(--kdl-popover-foreground);
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  white-space: nowrap;
}
.kdl-tp-peek { touch-action: none; -webkit-user-select: none; user-select: none; }
.kdl-tp-peek[aria-pressed="true"] { background: var(--kdl-accent); color: var(--kdl-accent-foreground); }

.kdl-tp-figure { display: inline-flex; flex-direction: column; gap: 4px; flex-shrink: 0; width: 152px; }
.kdl-tp-figure__caption { font-size: 11px; line-height: 1.3; color: var(--kdl-muted-foreground); }
.kdl-tp {
  --tp-radius: 2px;
  --tp-gap: 3px;
  display: flex;
  width: 152px;
  height: 96px;
  overflow: hidden;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--tp-bg);
  color: var(--tp-text);
  box-sizing: border-box;
  position: relative;
}
.kdl-tp i { display: block; font-style: normal; }
.kdl-tp__side { flex: 0 0 30px; display: flex; flex-direction: column; gap: 4px; padding: 5px 4px; background: var(--tp-surface); box-sizing: border-box; transition: flex-basis 0.2s; }
.kdl-tp__logo { height: 6px; width: 70%; border-radius: 2px; background: var(--tp-accent); }
.kdl-tp__nav { height: 3px; border-radius: 2px; background: var(--tp-muted); opacity: 0.55; }
.kdl-tp__nav--promo { margin-top: auto; height: 10px; opacity: 0.3; }
.kdl-tp__main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.kdl-tp__head { flex: 0 0 10px; display: flex; align-items: center; justify-content: space-between; padding: 0 5px; background: var(--tp-surface); }
.kdl-tp__crumb { width: 30px; height: 3px; border-radius: 2px; background: var(--tp-muted); opacity: 0.6; }
.kdl-tp__button { width: 14px; height: 5px; border-radius: 2px; background: var(--tp-accent); }
.kdl-tp__notice { flex: 0 0 6px; margin: 3px 5px 0; border-radius: 2px; background: color-mix(in srgb, var(--tp-accent) 35%, transparent); }
.kdl-tp__foot { flex: 0 0 6px; margin-top: auto; background: var(--tp-surface); opacity: 0.8; }
.kdl-tp__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--tp-gap); padding: 4px 5px; align-content: start; overflow: hidden; }
.kdl-tp__card { display: flex; flex-direction: column; overflow: hidden; border-radius: var(--tp-radius); background: var(--tp-surface); min-height: 0; position: relative; }
.kdl-tp__thumb { height: 17px; background: linear-gradient(135deg, color-mix(in srgb, var(--tp-accent) 45%, var(--tp-surface)), color-mix(in srgb, var(--tp-text) 18%, var(--tp-surface))); }
.kdl-tp__line { height: 2px; margin: 2px 3px 3px; border-radius: 2px; background: var(--tp-text); opacity: 0.6; }

.kdl-tp__post { display: flex; flex-direction: column; gap: 3px; padding: 4px 6px; overflow: hidden; }
.kdl-tp__title { height: 5px; width: 60%; border-radius: 2px; background: var(--tp-text); }
.kdl-tp__image { height: 24px; border-radius: var(--tp-radius); background: linear-gradient(135deg, color-mix(in srgb, var(--tp-accent) 45%, var(--tp-surface)), var(--tp-surface)); }
.kdl-tp__text { height: 2px; border-radius: 2px; background: var(--tp-text); opacity: 0.5; }
.kdl-tp__text--short { width: 70%; }
.kdl-tp__comments { display: flex; flex-direction: column; gap: 2px; padding: 3px; border-radius: var(--tp-radius); background: var(--tp-surface); }
.kdl-tp__comment { height: 2px; border-radius: 2px; background: var(--tp-muted); opacity: 0.6; }

.kdl-tp__creator { display: flex; flex-direction: column; gap: 3px; padding: 4px 5px; overflow: hidden; }
.kdl-tp__profile { position: relative; height: 22px; border-radius: var(--tp-radius); overflow: hidden; background: var(--tp-surface); }
.kdl-tp__banner { position: absolute; inset: 0; background: linear-gradient(120deg, color-mix(in srgb, var(--tp-accent) 55%, var(--tp-surface)), var(--tp-surface)); }
.kdl-tp__avatar { position: absolute; left: 4px; top: 4px; width: 14px; height: 14px; border-radius: 3px; background: var(--tp-muted); }
.kdl-tp__name { position: absolute; left: 22px; top: 8px; width: 34px; height: 4px; border-radius: 2px; background: var(--tp-text); }
.kdl-tp__tabs { display: flex; gap: 4px; }
.kdl-tp__tab { width: 18px; height: 4px; border-bottom: 1px solid transparent; }
.kdl-tp__tab::before { content: ''; display: block; height: 2px; border-radius: 2px; background: var(--tp-muted); opacity: 0.7; }
.kdl-tp__tab--active { border-bottom-color: var(--tp-accent); }
.kdl-tp__creator .kdl-tp__grid { padding: 0; }

/* Structural presets */
.kdl-tp[data-variant="dense"] .kdl-tp__grid { grid-template-columns: repeat(5, 1fr); gap: 1px; padding: 3px 4px; }
.kdl-tp[data-variant="dense"] .kdl-tp__thumb { height: 11px; }
.kdl-tp[data-variant="dense"] .kdl-tp__line { margin: 1px 2px 2px; height: 1px; }
.kdl-tp[data-variant="rail"] .kdl-tp__side { flex-basis: 10px; padding: 5px 2px; }
.kdl-tp[data-variant="rail"] .kdl-tp__nav { width: 6px; height: 6px; border-radius: 2px; }
.kdl-tp[data-variant="rail"] .kdl-tp__logo { width: 6px; }
.kdl-tp[data-variant="rail"] .kdl-tp__nav--promo, .kdl-tp[data-variant="rail"] .kdl-tp__notice, .kdl-tp[data-variant="rail"] .kdl-tp__foot { display: none; }
.kdl-tp[data-variant="rail"] .kdl-tp__grid { grid-template-columns: repeat(5, 1fr); }
.kdl-tp[data-variant="compact-header"] .kdl-tp__head {
  flex-basis: 5px;
  background: color-mix(in srgb, var(--tp-surface) 70%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--tp-text) 25%, transparent), 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}
.kdl-tp[data-variant="compact-header"] .kdl-tp__button { height: 3px; width: 10px; }
.kdl-tp[data-variant="compact-header"] .kdl-tp__crumb { height: 2px; }
.kdl-tp[data-variant="reader"] .kdl-tp__post { width: 62%; margin: 0 auto; padding-top: 6px; gap: 4px; }
.kdl-tp[data-variant="reader"] .kdl-tp__title { height: 6px; width: 85%; }
.kdl-tp[data-variant="reader"] .kdl-tp__text { height: 3px; opacity: 0.7; }
.kdl-tp[data-variant="reader"] .kdl-tp__image { height: 18px; }
.kdl-tp[data-variant="reader"] .kdl-tp__notice { display: none; }
.kdl-tp[data-variant="reader"] .kdl-tp__comments { background: none; -webkit-mask-image: linear-gradient(#000, transparent); mask-image: linear-gradient(#000, transparent); }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__profile { height: 14px; border-radius: 4px; }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__banner { display: none; }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__avatar { left: 3px; top: 2px; width: 10px; height: 10px; border-radius: 50%; }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__name { left: 17px; top: 5px; }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__tab { height: 5px; border: 0; border-radius: 9999px; background: var(--tp-surface); }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__tab::before { display: none; }
.kdl-tp[data-variant="creator-compact"] .kdl-tp__tab--active { background: var(--tp-accent); }
.kdl-tp[data-variant="dim"] .kdl-tp__card--viewed { opacity: 0.3; filter: grayscale(1); }
.kdl-tp[data-variant="dim"] .kdl-tp__card--viewed::after { content: ''; position: absolute; left: 2px; bottom: 2px; width: 9px; height: 3px; border-radius: 1px; background: rgba(255, 255, 255, 0.85); }

@media (max-width: 640px) {
  .kdl-tp-figure, .kdl-tp { width: 120px; }
  .kdl-tp { height: 76px; }
  .kdl-tp-figure__caption { display: none; }
}
`;
