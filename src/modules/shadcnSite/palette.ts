// Accent, base tone and surface contrast of the skin: one generated sheet of kit tokens.
//
// The tokens go on <html> for the site, and on .kdl-scope / .kdl-tokens / #kdl-root so the script's
// own kit UI (light-DOM widgets and the shadow root, whose :host defaults lose to an outer rule)
// follows the same palette. Explicitly light kit scopes are left alone. On <html> each token still
// falls back through its restyle variable, and restyle writes the kit tokens with the same
// specificity in a later sheet, so user themes keep winning.

import { KIT_DARK_TOKENS, kitIconTokens } from '../../ui/kit/tokens';
import { THEME_VARS } from '../restyle/vars';

interface Base {
  label: string;
  background: string;
  /** One step up from the background: cards and panels at "strong" contrast */
  surface: string;
  secondary: string;
  border: string;
  foreground: string;
  muted: string;
}

interface Accent {
  label: string;
  primary: string;
  onPrimary: string;
}

export const BASES: Record<string, Base> = {
  zinc: { label: 'Zinc (shadcn default)', background: '#09090b', surface: '#18181b', secondary: '#27272a', border: '#27272a', foreground: '#fafafa', muted: '#a1a1aa' },
  black: { label: 'Black (OLED)', background: '#000000', surface: '#0c0c0d', secondary: '#1c1c1e', border: '#222225', foreground: '#fafafa', muted: '#a1a1aa' },
  neutral: { label: 'Neutral grey', background: '#0a0a0a', surface: '#171717', secondary: '#262626', border: '#262626', foreground: '#fafafa', muted: '#a3a3a3' },
  slate: { label: 'Slate', background: '#020617', surface: '#0f172a', secondary: '#1e293b', border: '#1e293b', foreground: '#f8fafc', muted: '#94a3b8' },
  stone: { label: 'Stone', background: '#0c0a09', surface: '#1c1917', secondary: '#292524', border: '#292524', foreground: '#fafaf9', muted: '#a8a29e' },
  dim: { label: 'Dim (soft)', background: '#1c1c22', surface: '#25252c', secondary: '#31313a', border: '#36363f', foreground: '#f4f4f5', muted: '#a1a1aa' },
};

export const ACCENTS: Record<string, Accent> = {
  zinc: { label: 'Zinc (monochrome)', primary: '', onPrimary: '' },
  blue: { label: 'Blue', primary: '#3b82f6', onPrimary: '#f8fafc' },
  violet: { label: 'Violet', primary: '#8b5cf6', onPrimary: '#f9fafb' },
  rose: { label: 'Rose', primary: '#f43f5e', onPrimary: '#fff1f2' },
  orange: { label: 'Orange', primary: '#f97316', onPrimary: '#fafaf9' },
  green: { label: 'Green', primary: '#22c55e', onPrimary: '#052e16' },
  amber: { label: 'Amber', primary: '#f59e0b', onPrimary: '#1c1917' },
  custom: { label: 'Custom (hex below)', primary: '', onPrimary: '' },
};

/** How far cards and panels sit from the page: [card share of the surface colour, panels on] */
export const SURFACES: Record<string, { label: string; card: number; panels: boolean }> = {
  flat: { label: 'Flat (borders only)', card: 0, panels: false },
  subtle: { label: 'Subtle', card: 55, panels: true },
  strong: { label: 'Strong', card: 100, panels: true },
};

export interface PaletteOptions {
  accent: string;
  accentCustom: string;
  base: string;
  surfaces: string;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColour(value: string): boolean {
  return HEX.test(value.trim());
}

// Dark or light text on a custom accent, by relative luminance
function readableOn(hex: string): string {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#09090b' : '#fafafa';
}

const mix = (a: string, b: string, aShare: number): string =>
  aShare >= 100 ? a : aShare <= 0 ? b : `color-mix(in srgb, ${a} ${aShare}%, ${b})`;

/** Kit token values (and the skin's own --kdl-sidebar / --kdl-panel-*) for the options */
export function paletteTokens(options: PaletteOptions): Record<string, string> {
  const base = BASES[options.base] || BASES.zinc;
  const surface = SURFACES[options.surfaces] || SURFACES.subtle;
  let accent = ACCENTS[options.accent] || ACCENTS.zinc;
  if (options.accent === 'custom') {
    const hex = options.accentCustom.trim();
    accent = isHexColour(hex) ? { label: 'Custom', primary: hex, onPrimary: readableOn(hex) } : ACCENTS.zinc;
  }
  const coloured = Boolean(accent.primary);
  const primary = accent.primary || base.foreground;
  const onPrimary = accent.onPrimary || base.surface;
  const card = mix(base.surface, base.background, surface.card);
  const border = surface.card >= 100 ? mix(base.foreground, base.border, 7) : base.border;
  const tokens: Record<string, string> = {
    ...KIT_DARK_TOKENS,
    '--kdl-background': base.background,
    '--kdl-foreground': base.foreground,
    '--kdl-card': card,
    '--kdl-card-foreground': base.foreground,
    '--kdl-popover': card,
    '--kdl-popover-foreground': base.foreground,
    '--kdl-primary': primary,
    '--kdl-primary-foreground': onPrimary,
    '--kdl-secondary': base.secondary,
    '--kdl-secondary-foreground': base.foreground,
    '--kdl-muted': base.secondary,
    '--kdl-muted-foreground': base.muted,
    // Hover surfaces pick up a hint of a coloured accent
    '--kdl-accent': coloured ? mix(primary, base.secondary, 14) : base.secondary,
    '--kdl-accent-foreground': base.foreground,
    '--kdl-border': border,
    '--kdl-input': border,
    '--kdl-ring': coloured ? primary : mix(base.muted, base.foreground, 60),
    // Links inside text: the accent, or a soft blue on the grey accents (white links read as plain text)
    '--kdl-link': coloured ? mix(primary, base.foreground, 75) : '#7cb4ff',
    ...kitIconTokens(onPrimary, base.muted),
    '--kdl-sidebar': surface.panels ? card : mix(base.secondary, base.background, 30),
    '--kdl-panel-bg': surface.panels ? card : 'transparent',
    '--kdl-panel-border': surface.panels ? border : 'transparent',
    '--kdl-panel-pad': surface.panels ? '16px' : '0px',
  };
  delete tokens.colorScheme;
  return tokens;
}

const LIGHT = ':where(:not([data-theme="light"], .kdl-theme-light))';

/** The palette sheet; `scope` is the html compound the skin's rules use */
export function paletteCss(options: PaletteOptions, scope: string): string {
  const tokens = paletteTokens(options);
  // Kit token -> the restyle variable that drives it (--kdl-background <- --kdl-site-bg)
  const driver = new Map<string, string>();
  THEME_VARS.forEach((def) => def.kit.forEach((token) => token !== def.name && driver.set(token, def.name)));
  const entries = Object.entries(tokens);
  const site = entries.map(([name, value]) => `${name}: ${driver.has(name) ? `var(${driver.get(name)}, ${value})` : value};`);
  const kit = entries.filter(([name]) => !name.startsWith('--kdl-panel') && name !== '--kdl-sidebar').map(([name, value]) => `${name}: ${value};`);
  return [
    `${scope} {\n  ${site.join('\n  ')}\n}`,
    `${scope} .kdl-scope${LIGHT}, ${scope} .kdl-tokens${LIGHT}, ${scope} #kdl-root${LIGHT} {\n  ${kit.join('\n  ')}\n}`,
  ].join('\n');
}

const options = (record: Record<string, { label: string }>) => Object.entries(record).map(([value, { label }]) => ({ value, label }));
export const ACCENT_OPTIONS = options(ACCENTS);
export const BASE_OPTIONS = options(BASES);
export const SURFACE_OPTIONS = options(SURFACES);
