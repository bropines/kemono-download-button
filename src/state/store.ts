import { DEFAULT_SETTINGS } from '../config/constants';
import { readStored, writeStored } from './gmStorage';
import { saveBlob } from '../utils/saveFile';
import { AppState, DownloaderSettings } from '../types';
import { debugLog } from '../utils/helpers';

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
  return importCount;
}
