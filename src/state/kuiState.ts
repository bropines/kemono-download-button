import { KUI_STORAGE_KEYS } from '../config/storage';
import { KuiAppState, EmbedRules } from '../types';

const readValue = <T>(key: string, fallback: T): T => (typeof GM_getValue === 'function' ? GM_getValue<T>(key, fallback) : fallback);

export const kuiState: KuiAppState = {
  isDebugModeEnabled: readValue(KUI_STORAGE_KEYS.DEBUG_MODE, false),
  isVerboseDebugEnabled: readValue(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false),
  isPreloadEnabled: readValue(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false),
  isHideEmptySectionsEnabled: readValue(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, true),
  isPostPageModuleActive: false,
  embedRules: readValue<EmbedRules>(KUI_STORAGE_KEYS.EMBED_RULES, {}),
  sessionKey: readValue(KUI_STORAGE_KEYS.SESSION_KEY, "")
};

export function setDebugMode(enabled: boolean): void {
  kuiState.isDebugModeEnabled = enabled;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.DEBUG_MODE, enabled);
}

export function setVerboseDebugMode(enabled: boolean): void {
  kuiState.isVerboseDebugEnabled = enabled;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.VERBOSE_DEBUG, enabled);
}

export function setPreloadImages(enabled: boolean): void {
  kuiState.isPreloadEnabled = enabled;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.PRELOAD_IMAGES, enabled);
}

export function setHideEmptySections(enabled: boolean): void {
  kuiState.isHideEmptySectionsEnabled = enabled;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, enabled);
}

export function setEmbedRules(rules: EmbedRules): void {
  kuiState.embedRules = rules;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.EMBED_RULES, rules);
}

export function setSessionKey(key: string): void {
  kuiState.sessionKey = key;
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.SESSION_KEY, key);
}
