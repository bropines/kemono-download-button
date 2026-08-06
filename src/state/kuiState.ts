import { KUI_STORAGE_KEYS } from '../config/storage';
import { KuiAppState, EmbedRules } from '../types';

export const kuiState: KuiAppState = {
  isDebugModeEnabled: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.DEBUG_MODE, false) as any) : false,
  isVerboseDebugEnabled: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false) as any) : false,
  isPreloadEnabled: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false) as any) : false,
  isHideEmptySectionsEnabled: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, false) as any) : false,
  isPostPageModuleActive: false,
  embedRules: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.EMBED_RULES, {}) as any) : {},
  sessionKey: typeof GM_getValue === 'function' ? (GM_getValue(KUI_STORAGE_KEYS.SESSION_KEY, "") as any) : ""
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
