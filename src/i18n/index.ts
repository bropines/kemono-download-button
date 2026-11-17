// Localization: t() for our interface, a site dictionary for the site's own chrome (./site.ts).
//
// Sources, best first: a validated pack downloaded from the repo and cached in storage (./packs.ts),
// a pack bundled into the script (Russian), the English baseline in ./en. English is never downloaded.
import { readStored, writeStored } from '../state/gmStorage';
import ruPack from '../../locales/ru.json';
import { en, type UiKey } from './en';
import { formatMessage, type MessageParams } from './format';
import type { LocaleIndex, LocalePack } from './types';

export type { UiKey } from './en';
export type { MessageParams } from './format';
export type { LocalePack, LocaleIndex, LocaleIndexEntry } from './types';

export const LANG_SETTING_KEY = 'i18n.lang';
export const PACK_KEY_PREFIX = 'i18n.pack.';
export const INDEX_KEY = 'i18n.index';

const BUNDLED: Record<string, LocalePack> = { ru: ruPack as LocalePack };
const BASE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

interface SitePattern {
  regex: RegExp;
  names: string[];
  message: string;
}

export interface SiteDictionary {
  exact: Map<string, string>;
  patterns: SitePattern[];
}

let activeCode = 'en';
let activePack: LocalePack | null = null;
let siteDictionary: SiteDictionary | null = null;
const listeners = new Set<(code: string) => void>();

const isPack = (value: unknown): value is LocalePack => {
  const pack = value as LocalePack | null;
  return !!pack && typeof pack.code === 'string' && typeof pack.version === 'number' && typeof pack.ui === 'object' && typeof pack.site === 'object';
};

/** The cached (validated) download for a language, if any. */
export function readCachedPack(code: string): LocalePack | null {
  const raw = readStored<string>(PACK_KEY_PREFIX + code, '');
  if (!raw) return null;
  try {
    const pack = JSON.parse(raw);
    return isPack(pack) && pack.code === code ? pack : null;
  } catch {
    return null;
  }
}

/** The newest pack available offline for a language: the cached download or the bundled copy. */
export function localPack(code: string): LocalePack | null {
  const cached = readCachedPack(code);
  const bundled = BUNDLED[code] ?? null;
  if (cached && (!bundled || cached.version >= bundled.version)) return cached;
  return bundled;
}

export function readCachedIndex(): LocaleIndex | null {
  const raw = readStored<string>(INDEX_KEY, '');
  if (!raw) return null;
  try {
    const index = JSON.parse(raw) as LocaleIndex;
    return Array.isArray(index?.packs) ? index : null;
  } catch {
    return null;
  }
}

/** 'auto' or a language code. */
export function getLanguageSetting(): string {
  return readStored<string>(LANG_SETTING_KEY, 'auto') || 'auto';
}

/** Languages to offer: English, the bundled ones and whatever the last downloaded index listed. */
export function availableLanguages(): { code: string; name: string }[] {
  const list = [...BASE_LANGUAGES];
  readCachedIndex()?.packs.forEach((entry) => {
    if (!list.some((l) => l.code === entry.code)) list.push({ code: entry.code, name: entry.name });
  });
  return list;
}

/** The language the setting asks for ('auto' resolves through navigator.languages). */
export function resolveLanguage(setting = getLanguageSetting()): string {
  if (setting !== 'auto') return setting;
  const known = new Set(availableLanguages().map((l) => l.code));
  const wanted = (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean);
  for (const tag of wanted) {
    const lower = tag.toLowerCase();
    if (known.has(lower)) return lower;
    const base = lower.split('-')[0];
    if (known.has(base)) return base;
  }
  return 'en';
}

/** The language t() currently speaks ('en' when the wanted pack is not available yet). */
export function getLanguage(): string {
  return activeCode;
}

export function getActivePack(): LocalePack | null {
  return activePack;
}

function load(): void {
  const wanted = resolveLanguage();
  const pack = wanted === 'en' ? null : localPack(wanted);
  activeCode = pack ? wanted : 'en';
  activePack = pack;
  siteDictionary = null;
}

/** Re-reads the setting and the packs; notifies listeners when the result changed (or always with force). */
export function reloadLanguage(force = false): void {
  const before = `${activeCode}@${activePack?.version ?? 0}`;
  load();
  const after = `${activeCode}@${activePack?.version ?? 0}`;
  if (!force && before === after) return;
  listeners.forEach((fn) => {
    try {
      fn(activeCode);
    } catch (error) {
      console.error('[KDL:i18n] language listener failed:', error);
    }
  });
}

export function setLanguageSetting(setting: string): void {
  writeStored(LANG_SETTING_KEY, setting);
  reloadLanguage();
}

/** Called after the language or the active pack changes. Returns an unsubscribe. */
export function onLanguageChange(fn: (code: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Translates a key of the English baseline. */
export function t(key: UiKey, params?: MessageParams): string {
  return formatMessage(activePack?.ui[key] ?? en[key] ?? key, params, activeCode);
}

/**
 * Translates a key that is not part of the baseline (built from an id at run time, e.g. module names:
 * `mod.<id>.name`), falling back to the English text the caller already has.
 */
export function tx(key: string, fallback: string, params?: MessageParams): string {
  return formatMessage(activePack?.ui[key] ?? (en as Record<string, string>)[key] ?? fallback, params, activeCode);
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compileSite(site: Record<string, string>): SiteDictionary {
  const exact = new Map<string, string>();
  const patterns: SitePattern[] = [];
  Object.entries(site).forEach(([source, message]) => {
    if (typeof message !== 'string' || !message) return;
    const key = normalize(source);
    if (!/\{\w+\}/.test(key)) {
      exact.set(key, message);
      return;
    }
    const names: string[] = [];
    const body = key
      .split(/(\{\w+\})/)
      .map((part) => {
        const name = /^\{(\w+)\}$/.exec(part);
        if (name) {
          names.push(name[1]);
          return '(.+?)';
        }
        return escapeRegex(part).replace(/ /g, '\\s+');
      })
      .join('');
    patterns.push({ regex: new RegExp(`^${body}$`), names, message });
  });
  return { exact, patterns };
}

/** The site dictionary of the active language, or null in English. */
export function getSiteDictionary(): SiteDictionary | null {
  if (!activePack) return null;
  return (siteDictionary ??= compileSite(activePack.site ?? {}));
}

/** Translates one piece of site text; null when the dictionary has nothing for it. */
export function translateSiteText(text: string): string | null {
  const dict = getSiteDictionary();
  if (!dict) return null;
  const key = normalize(text);
  if (!key) return null;
  const hit = dict.exact.get(key);
  if (hit !== undefined) return hit;
  for (const pattern of dict.patterns) {
    const match = pattern.regex.exec(key);
    if (!match) continue;
    const params: MessageParams = {};
    pattern.names.forEach((name, i) => {
      const raw = match[i + 1];
      // "1,234" counts for plural rules as 1234; the text itself is kept as the site wrote it
      const numeric = raw.replace(/[,\s]/g, '');
      params[name] = /^\d+$/.test(numeric) && pattern.message.includes(`${name}, plural`) ? Number(numeric) : raw;
    });
    return formatMessage(pattern.message, params, activeCode);
  }
  return null;
}

load();
