// What a downloader setting may hold, for everything that writes settings from outside the dialog: a settings
// file, a "without secrets" file, an answer from an AI. A value that fails here is skipped, never coerced.

import { DEFAULT_SETTINGS } from '../config/constants';
import type { DownloaderSettings } from '../types';

type Key = keyof DownloaderSettings;

/** Private values: the site session and the translation API keys. Never in a shareable file. */
export const SECRET_SETTING_KEYS: readonly Key[] = ['sessionCookie', 'geminiApiKey', 'openaiApiKey', 'deeplApiKey'];

export const isSecretSetting = (key: string): boolean => (SECRET_SETTING_KEYS as readonly string[]).includes(key);

/** Allowed values of the enum-like settings */
export const SETTING_CHOICES: Partial<Record<Key, readonly (string | number)[]>> = {
  imageTranslateErase: ['patch', 'hull'],
  imageTranslateAlign: ['auto', 'left', 'center', 'right'],
  imageTranslateVertical: ['auto', 'keep', 'horizontal'],
  imageTranslateSharpness: [1, 2, 3],
  translationProvider: ['none', 'gemini', 'openai', 'deepl', 'yandex', 'google'],
  deeplApiTier: ['free', 'pro'],
  downloadPanelPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'],
  bulkDownloadMode: ['single', 'multiple'],
  apiCacheLifetime: ['off', 'short', 'normal', 'long'],
  zipCompressionLevel: [0, 1, 4, 6, 9],
};

/** Inclusive ranges of the numeric settings (the dialog's and the Lens panel's limits) */
export const SETTING_RANGES: Partial<Record<Key, readonly [number, number]>> = {
  maxConcurrentFileDownloadsInZip: [1, 10],
  maxConcurrentOperations: [1, 5],
  maxConcurrentIndividualDownloads: [1, 10],
  downloadRetryCount: [0, 5],
  downloadRetryDelay: [500, Infinity],
  zipFileDownloadTimeout: [10000, Infinity],
  cacheDurationHours: [0, Infinity],
  imageTranslateMinPx: [0, 32],
  imageTranslateLineSpacing: [0.8, 2],
  imageTranslateHullPadding: [0, 2],
  imageTranslateOutline: [0, 8],
  imageTranslateMangaGrowth: [1, 2.5],
};

/** Longest text a template or a short text setting may be */
export const MAX_TEMPLATE_LENGTH = 500;
const MAX_TEXT_LENGTH = 5000;
const MAX_LIST = 200;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** True when `value` may be stored under the downloader setting `key` */
export function isValidSetting(key: string, value: unknown): boolean {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return false;
  const k = key as Key;
  const fallback = DEFAULT_SETTINGS[k];
  const choices = SETTING_CHOICES[k];
  if (choices) return choices.includes(value as string | number);
  if (k === 'savedFileNameTemplates') {
    return Array.isArray(value) && value.length <= MAX_LIST
      && new Set(value.map((item) => (isPlainObject(item) ? item.name : item))).size === value.length
      && value.every((item) =>
      isPlainObject(item) && typeof item.name === 'string' && item.name.trim() !== '' && item.name.length <= 200
      && typeof item.template === 'string' && item.template.trim() !== '' && item.template.length <= MAX_TEMPLATE_LENGTH);
  }
  if (k === 'ignoredFileExtensions') {
    return Array.isArray(value) && value.length <= MAX_LIST
      && value.every((item) => typeof item === 'string' && /^\.?[A-Za-z0-9]{1,16}$/.test(item.trim()));
  }
  if (typeof fallback === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    const range = SETTING_RANGES[k];
    return !range || (value >= range[0] && value <= range[1]);
  }
  if (typeof fallback === 'string') {
    if (typeof value !== 'string') return false;
    const max = /Template$/.test(k) ? MAX_TEMPLATE_LENGTH : MAX_TEXT_LENGTH;
    if (value.length > max) return false;
    // A blank template would name every file "untitled"
    return !/Template$/.test(k) || value.trim() !== '';
  }
  return typeof value === typeof fallback && Array.isArray(value) === Array.isArray(fallback);
}

/** Lower-case extensions without the dot, deduplicated (what the dialog stores) */
export const normalizeExtensions = (list: string[]): string[] =>
  [...new Set(list.map((ext) => ext.trim().replace(/^\./, '').toLowerCase()).filter(Boolean))];
