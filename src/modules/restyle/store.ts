// Theme storage: one key per theme (`restyle.theme.<id>`) plus an id index (`restyle.themes`).
// Built-in presets live in code; only their on/off state is stored (`restyle.builtins`).
// Everything goes through readStored/writeStored, so objects survive AdGuard reloads.

import type { PageType, SiteId } from '../../core/types';
import { readStored, writeStored } from '../../state/gmStorage';
import { BUILTIN_THEMES } from './presets';
import { PAGE_TYPES, SITE_IDS, TRANSFORM_ACTIONS, type Theme, type Transform } from './types';
import { isValidVar } from './vars';
import { t, tx } from '../../i18n';

const INDEX_KEY = 'restyle.themes';
const BUILTINS_KEY = 'restyle.builtins';
const themeKey = (id: string) => `restyle.theme.${id}`;

export const MAX_THEME_BYTES = 200 * 1024;
export const EXPORT_FORMAT = 'kdl-theme';
export const EXPORT_VERSION = 1;

export class ThemeError extends Error {}

let userThemes: Theme[] | null = null;
let builtinState: Record<string, boolean> | null = null;
const listeners = new Set<() => void>();

export function onThemesChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.error('[KDL:restyle] listener failed:', error);
    }
  });
}

export function newThemeId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const asString = (value: unknown, max = MAX_THEME_BYTES): string => (typeof value === 'string' ? value.slice(0, max) : '');

function asScope<T extends string>(value: unknown, allowed: readonly T[]): T[] | 'any' {
  if (!Array.isArray(value)) return 'any';
  const list = value.filter((v): v is T => allowed.includes(v as T));
  return list.length ? [...new Set(list)] : 'any';
}

function sanitizeTransform(raw: unknown): Transform | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const action = TRANSFORM_ACTIONS.find((a) => a === r.action);
  const selector = asString(r.selector, 2000).trim();
  if (!action || !selector) return null;
  const t: Transform = { selector, action };
  if (typeof r.arg === 'string' && r.arg !== '') t.arg = r.arg.slice(0, 5000);
  const pages = asScope<PageType>(r.pages, PAGE_TYPES);
  if (pages !== 'any') t.pages = pages;
  return t;
}

/** Normalises anything theme-shaped; never trusts the input */
export function sanitizeTheme(raw: unknown, fallbackId = newThemeId()): Theme {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = typeof r.id === 'string' && /^[\w-]{1,64}$/.test(r.id) ? r.id : fallbackId;
  const vars: Record<string, string> = {};
  if (r.vars && typeof r.vars === 'object') {
    for (const [name, value] of Object.entries(r.vars as Record<string, unknown>)) {
      if (typeof value === 'string' && isValidVar(name, value)) vars[name] = value.trim();
    }
  }
  const origin = r.origin === 'import' || r.origin === 'builtin' ? r.origin : 'local';
  const theme: Theme = {
    id,
    name: asString(r.name, 200).trim() || 'Untitled theme',
    enabled: r.enabled === true,
    sites: asScope<SiteId>(r.sites, SITE_IDS),
    pages: asScope<PageType>(r.pages, PAGE_TYPES),
    vars,
    css: asString(r.css),
    transforms: Array.isArray(r.transforms) ? r.transforms.map(sanitizeTransform).filter((t): t is Transform => !!t).slice(0, 500) : [],
    origin,
  };
  if (typeof r.description === 'string' && r.description) theme.description = r.description.slice(0, 1000);
  if (origin === 'local' && typeof r.script === 'string' && r.script.trim()) theme.script = r.script.slice(0, MAX_THEME_BYTES);
  return theme;
}

export function themeSize(theme: Theme): number {
  return new Blob([JSON.stringify(theme)]).size;
}

function assertSize(theme: Theme): void {
  const size = themeSize(theme);
  if (size > MAX_THEME_BYTES) {
    throw new ThemeError(
      t('themes.error.tooBig', { name: theme.name, size: Math.ceil(size / 1024), max: MAX_THEME_BYTES / 1024 })
    );
  }
}

function loadUserThemes(): Theme[] {
  if (userThemes) return userThemes;
  const ids = readStored<string[]>(INDEX_KEY, []);
  userThemes = (Array.isArray(ids) ? ids : [])
    .map((id) => {
      const raw = readStored<unknown>(themeKey(id), null);
      return raw ? sanitizeTheme(raw, id) : null;
    })
    .filter((t): t is Theme => !!t && t.origin !== 'builtin');
  return userThemes;
}

function loadBuiltinState(): Record<string, boolean> {
  if (builtinState) return builtinState;
  const raw = readStored<Record<string, boolean>>(BUILTINS_KEY, {});
  builtinState = raw && typeof raw === 'object' ? raw : {};
  return builtinState;
}

function saveIndex(): void {
  writeStored(INDEX_KEY, loadUserThemes().map((t) => t.id));
}

export function isBuiltin(id: string): boolean {
  return BUILTIN_THEMES.some((t) => t.id === id);
}

/** Built-ins first, then the user's themes in creation order */
export function getThemes(): Theme[] {
  const state = loadBuiltinState();
  return [...BUILTIN_THEMES.map((t) => ({ ...t, enabled: state[t.id] === true })), ...loadUserThemes()];
}

export function getTheme(id: string): Theme | undefined {
  return getThemes().find((t) => t.id === id);
}

export function getEnabledThemes(): Theme[] {
  return getThemes().filter((t) => t.enabled);
}

export function setThemeEnabled(id: string, enabled: boolean): void {
  if (isBuiltin(id)) {
    const state = { ...loadBuiltinState(), [id]: enabled };
    builtinState = state;
    writeStored(BUILTINS_KEY, state);
    emit();
    return;
  }
  const theme = loadUserThemes().find((t) => t.id === id);
  if (theme) saveTheme({ ...theme, enabled });
}

/** Creates or replaces a user theme. Throws ThemeError when it is too big. */
export function saveTheme(input: Theme): Theme {
  if (isBuiltin(input.id)) throw new ThemeError(t('themes.error.readOnly'));
  const existing = loadUserThemes().find((t) => t.id === input.id);
  // Origin is fixed at creation: an imported theme never gains a script by being edited
  const origin = existing?.origin ?? (input.origin === 'import' ? 'import' : 'local');
  const theme = sanitizeTheme({ ...input, origin }, input.id);
  assertSize(theme);
  writeStored(themeKey(theme.id), theme);
  const list = loadUserThemes();
  const index = list.findIndex((t) => t.id === theme.id);
  if (index >= 0) list[index] = theme;
  else {
    list.push(theme);
    saveIndex();
  }
  emit();
  return theme;
}

export function deleteTheme(id: string): void {
  const list = loadUserThemes();
  const index = list.findIndex((t) => t.id === id);
  if (index < 0) return;
  list.splice(index, 1);
  saveIndex();
  // No GM_deleteValue grant: an empty string reads back as "no theme"
  writeStored(themeKey(id), '');
  emit();
}

export function createTheme(partial: Partial<Theme> = {}): Theme {
  return saveTheme(
    sanitizeTheme({ name: t('themes.defaultName'), enabled: true, sites: 'any', pages: 'any', vars: {}, css: '', transforms: [], ...partial, id: newThemeId(), origin: 'local' })
  );
}

export function duplicateTheme(id: string): Theme | null {
  const source = getTheme(id);
  if (!source) return null;
  // A built-in copy is the user's own; an imported theme stays "imported" (no scripts)
  const origin = source.origin === 'import' ? 'import' : 'local';
  return saveTheme(sanitizeTheme({ ...source, id: newThemeId(), name: t('themes.copyName', { name: source.origin === 'builtin' ? tx(`themes.preset.${source.id}.name`, source.name) : source.name }), enabled: false, origin }));
}

// --- Import / export ----------------------------------------------------------------------

function exportable(theme: Theme): Omit<Theme, 'origin' | 'script'> {
  const { origin: _origin, script: _script, ...rest } = theme;
  return rest;
}

export function exportThemeJson(theme: Theme): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, theme: exportable(theme) }, null, 2);
}

export function exportAllJson(): string {
  return JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, themes: loadUserThemes().map(exportable) },
    null,
    2
  );
}

/**
 * Imports `{format:'kdl-theme', version:1, theme}` or `{…, themes:[…]}`. Scripts are always
 * dropped, ids are always new and imported themes start disabled.
 */
export function importThemesJson(text: string): Theme[] {
  if (text.length > MAX_THEME_BYTES * 50) throw new ThemeError(t('themes.error.fileTooLarge'));
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ThemeError(t('themes.error.invalidJson'));
  }
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.format !== EXPORT_FORMAT) throw new ThemeError(t('themes.error.notTheme'));
  if (typeof d.version !== 'number' || d.version > EXPORT_VERSION) {
    throw new ThemeError(t('themes.error.version', { version: String(d.version) }));
  }
  const raws = Array.isArray(d.themes) ? d.themes : d.theme ? [d.theme] : [];
  if (!raws.length) throw new ThemeError(t('themes.error.noThemes'));
  const prepared = raws.map((raw) => {
    const r = { ...(raw as Record<string, unknown>) };
    delete r.script;
    const theme = sanitizeTheme({ ...r, id: newThemeId(), origin: 'import', enabled: false });
    assertSize(theme);
    return theme;
  });
  return prepared.map(saveTheme);
}
