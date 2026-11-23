import { DEFAULT_SETTINGS } from '../config/constants';
import { readStored, writeStored } from './gmStorage';
import { saveBlob } from '../utils/saveFile';
import { AppState, DownloaderSettings } from '../types';
import { debugLog } from '../utils/helpers';
import { KUI_STORAGE_KEYS } from '../config/storage';
import { kuiState, setDebugMode, setSessionKey, setVerboseDebugMode } from './kuiState';
import { exportExtraSettings, importExtraSettings } from './settingsTransfer';
import { isSecretSetting, isValidSetting, SECRET_SETTING_KEYS } from './settingsSchema';
import { isAiPackData } from './aiPack';
import { scriptVersion } from '../utils/version';
import { t } from '../i18n';

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
  debugLog('Settings loaded');
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

// ---- Backups -----------------------------------------------------------------------------------
// A backup is `{format: 'kdl-settings', version, kind, script, exportedAt, settings: {...}}`; `settings` is the
// flat object older versions exported as the whole file (downloader keys plus interface and mod.* keys), so
// those files still import. "full" carries everything; "safe" has every secret key removed (not blanked), so
// importing it leaves the secrets of this browser as they are.

export const SETTINGS_FORMAT = 'kdl-settings';
export const SETTINGS_FORMAT_VERSION = 2;

export type BackupKind = 'full' | 'safe';

export interface SettingsBackup {
  format: typeof SETTINGS_FORMAT;
  version: number;
  kind: BackupKind;
  script: string;
  exportedAt: string;
  containsSecrets: boolean;
  note: string;
  settings: Record<string, unknown>;
}

/** What an imported file is: a backup (new or pre-format), an AI pack, a theme file */
export type ImportKind = BackupKind | 'legacy' | 'ai' | 'theme';

export interface ImportPlan {
  kind: ImportKind;
  data: Record<string, unknown>;
  /** Backups: the settings to apply */
  values: Record<string, unknown>;
  script?: string;
  exportedAt?: string;
  /** Backups: how many keys this version knows, and how many of them are secrets */
  known: number;
  secrets: number;
}

export interface ImportResult {
  applied: string[];
  skipped: string[];
}

export async function buildBackup(kind: BackupKind): Promise<SettingsBackup> {
  await getSettings();
  const settings: Record<string, unknown> = JSON.parse(JSON.stringify({ ...state.settings, ...exportExtraSettings() }));
  if (kind === 'safe') SECRET_SETTING_KEYS.forEach((key) => delete settings[key]);
  const containsSecrets = kind === 'full';
  return {
    format: SETTINGS_FORMAT,
    version: SETTINGS_FORMAT_VERSION,
    kind,
    script: scriptVersion(),
    exportedAt: new Date().toISOString(),
    containsSecrets,
    note: containsSecrets
      ? 'FULL BACKUP: contains your site session cookie and translation API keys. Keep it private; do not share it.'
      : 'Shareable: session cookie and API keys are removed. Importing it keeps the keys already set in the browser.',
    settings,
  };
}

export async function exportBackup(kind: BackupKind): Promise<void> {
  const json = JSON.stringify(await buildBackup(kind), null, 2);
  const name = kind === 'full' ? 'kemono-downloader-backup-PRIVATE' : 'kemono-downloader-settings-shareable';
  saveBlob(new Blob([json], { type: 'application/json;charset=utf-8' }), `${name}-${new Date().toISOString().split('T')[0]}.json`, true);
}

/** The full backup (the old "Export") */
export const exportSettings = (): Promise<void> => exportBackup('full');

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Reads a file and says what it is, without applying anything. Throws on anything that is not ours. */
export function inspectImport(jsonString: string): ImportPlan {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error(t('settings.import.notJson'));
  }
  if (!isObject(data)) throw new Error(t('settings.import.notSettings'));
  const plan = (kind: ImportKind, values: Record<string, unknown> = {}): ImportPlan => {
    const knownKeys = new Set([...Object.keys(DEFAULT_SETTINGS), ...Object.keys(exportExtraSettings())]);
    const known = Object.keys(values).filter((key) => knownKeys.has(key));
    return {
      kind, data, values,
      script: typeof data.script === 'string' ? data.script : undefined,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : undefined,
      known: known.length,
      secrets: kind === 'safe' ? 0 : known.filter(isSecretSetting).length,
    };
  };
  if (data.format === SETTINGS_FORMAT) {
    if (typeof data.version !== 'number' || data.version > SETTINGS_FORMAT_VERSION) throw new Error(t('settings.import.newerVersion'));
    if (!isObject(data.settings)) throw new Error(t('settings.import.notSettings'));
    return plan(data.kind === 'safe' ? 'safe' : 'full', data.settings);
  }
  if (isAiPackData(data)) return plan('ai');
  if (data.format === 'kdl-theme') return plan('theme');
  // A pre-format export: the flat object itself. It must hold at least one key we know
  const legacy = plan('legacy', data);
  if (!legacy.known) throw new Error(t('settings.import.notSettings'));
  return legacy;
}

/** Applies a backup plan. Wrong types and unknown keys are skipped; a "safe" file never touches a secret. */
export async function applyBackup(plan: ImportPlan): Promise<ImportResult> {
  if (plan.kind === 'ai' || plan.kind === 'theme') throw new Error(t('settings.import.notSettings'));
  await getSettings();
  const values = plan.values;
  const applied: string[] = [];
  for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof DownloaderSettings>) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) continue;
    if (plan.kind === 'safe' && isSecretSetting(key)) continue;
    // Older exports could carry a blank template; loading falls back to the default as it always did
    const value = values[key];
    if (isValidSetting(key, value) || (key === 'fileNameTemplate' && value === '')) {
      await saveSetting(key, value as DownloaderSettings[typeof key]);
      applied.push(key);
    }
  }
  settingsLoadPromise = null;
  await getSettings();
  syncSessionKey();
  setDebugMode(state.settings.enableDebugLogging);
  applied.push(...importExtraSettings(values));
  const skipped = Object.keys(values).filter((key) => !applied.includes(key) && !(plan.kind === 'safe' && isSecretSetting(key)));
  return { applied, skipped };
}

/** Imports a backup file (older flat files too); returns how many settings were applied. */
export async function importSettings(jsonString: string): Promise<number> {
  return (await applyBackup(inspectImport(jsonString))).applied.length;
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
