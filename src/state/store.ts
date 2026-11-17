import { DEFAULT_SETTINGS } from '../config/constants';
import { readStored, writeStored } from './gmStorage';
import { saveBlob } from '../utils/saveFile';
import { AppState, DownloaderSettings } from '../types';
import { debugLog } from '../utils/helpers';
import { KUI_STORAGE_KEYS } from '../config/storage';
import { kuiState, setDebugMode, setSessionKey, setVerboseDebugMode } from './kuiState';

export const state = {
  settings: { ...DEFAULT_SETTINGS } as DownloaderSettings
};

export const appState: AppState = {
  globalMediaCounter: 0,
  cachedPostFiles: null,
  originalPostContentHTML: null,
  downloadQueue: [],
  isQueueProcessing: false,
  activeOperations: 0,
  selectedPostIds: new Set<string>(),
  translationCache: {},
  favoritedArtists: new Set<string>(),
  favoritedPosts: new Set<string>(),
  favoritesFetched: false,
  queueIndicatorElement: null
};

export function resetMediaCounter(): void {
  appState.globalMediaCounter = 0;
}

let settingsLoadPromise: Promise<void> | null = null;

async function _loadSettingsAsync(): Promise<void> {
  const loadedSettings: Partial<DownloaderSettings> = {};
  const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof DownloaderSettings>;
  const values = await Promise.all(
    keys.map((key) => readStored(key, DEFAULT_SETTINGS[key]))
  );
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    (loadedSettings as any)[key] = values[i];
  }
  state.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
  if (!state.settings.fileNameTemplate || !state.settings.fileNameTemplate.trim()) {
    state.settings.fileNameTemplate = DEFAULT_SETTINGS.fileNameTemplate;
  }
  migrateMergedSettings();
  debugLog('Settings loaded:', state.settings);
}

export function getSettings(): Promise<void> {
  if (!settingsLoadPromise) {
    settingsLoadPromise = _loadSettingsAsync();
  }
  return settingsLoadPromise;
}

export async function saveSetting<K extends keyof DownloaderSettings>(key: K, value: DownloaderSettings[K]): Promise<void> {
  writeStored(key, value);
  state.settings[key] = value;
}

export async function exportSettings(): Promise<void> {
  await getSettings();
  const settingsJson = JSON.stringify(state.settings, null, 2);
  const blob = new Blob([settingsJson], { type: 'application/json;charset=utf-8' });
  saveBlob(blob, `kemono-downloader-settings-${new Date().toISOString().split('T')[0]}.json`, true);
}

export async function importSettings(jsonString: string): Promise<number> {
  const newSettings = JSON.parse(jsonString);
  await getSettings();
  let importCount = 0;
  for (const key in DEFAULT_SETTINGS) {
    const k = key as keyof DownloaderSettings;
    if (Object.prototype.hasOwnProperty.call(newSettings, k)) {
      if (typeof newSettings[k] === typeof DEFAULT_SETTINGS[k]) {
        await saveSetting(k, newSettings[k]);
        importCount++;
      }
    }
  }
  settingsLoadPromise = null;
  await getSettings();
  syncSessionKey();
  return importCount;
}

// ---- Merged settings -------------------------------------------------------------------------
// The downloader (settings.sessionCookie, settings.enableDebugLogging) and the KUI layer
// (kui_session_key, kui_debug_mode) used to keep their own copies. The settings dialog edits one
// value; both storages stay written so every reader keeps working.

const SESSION_MIGRATED_KEY = 'kdl_session_key_migrated';

/** A bare key becomes `session=<key>`; a cookie string (anything with "=") is kept as is. */
export function normalizeSessionCookie(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  return value.includes('=') ? value : `session=${value}`;
}

/** The value of the `session` cookie inside a cookie string ('' when absent). */
export function sessionKeyFromCookie(cookie: string): string {
  return /(?:^|;\s*)session=([^;]*)/.exec(cookie)?.[1]?.trim() ?? '';
}

function syncSessionKey(): void {
  const key = sessionKeyFromCookie(state.settings.sessionCookie || '');
  if (kuiState.sessionKey !== key) setSessionKey(key);
}

export async function setSession(raw: string): Promise<void> {
  await saveSetting('sessionCookie', normalizeSessionCookie(raw));
  syncSessionKey();
}

/** One switch: console logging (enableDebugLogging) plus the on-page debugger. Off also turns verbose off. */
export async function setDebug(enabled: boolean): Promise<void> {
  await saveSetting('enableDebugLogging', enabled);
  setDebugMode(enabled);
  if (!enabled) setVerboseDebugMode(false);
}

function migrateMergedSettings(): void {
  // The old KUI session key moves into the downloader cookie once
  if (!readStored(SESSION_MIGRATED_KEY, false)) {
    const oldKey = kuiState.sessionKey.trim();
    const cookie = (state.settings.sessionCookie || '').trim();
    if (oldKey && !sessionKeyFromCookie(cookie)) {
      const keyCookie = normalizeSessionCookie(oldKey);
      state.settings.sessionCookie = cookie ? `${cookie}; ${keyCookie}` : keyCookie;
      writeStored('sessionCookie', state.settings.sessionCookie);
    }
    writeStored(SESSION_MIGRATED_KEY, true);
  }
  syncSessionKey();
  // Either old debug flag turns the merged one on
  if (state.settings.enableDebugLogging !== kuiState.isDebugModeEnabled) {
    const enabled = state.settings.enableDebugLogging || kuiState.isDebugModeEnabled;
    state.settings.enableDebugLogging = enabled;
    writeStored('enableDebugLogging', enabled);
    setDebugMode(enabled);
  }
}

/** Defaults for every downloader and interface setting. Keeps the session cookie and embed rules. */
export async function resetSettings(): Promise<void> {
  await getSettings();
  for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof DownloaderSettings>) {
    if (key === 'sessionCookie') continue;
    await saveSetting(key, JSON.parse(JSON.stringify(DEFAULT_SETTINGS[key])));
  }
  setDebugMode(false);
  setVerboseDebugMode(false);
  kuiState.isPreloadEnabled = false;
  writeStored(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false);
  kuiState.isHideEmptySectionsEnabled = true;
  writeStored(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, true);
  writeStored(KUI_STORAGE_KEYS.GRID_SIZE, '180');
}
