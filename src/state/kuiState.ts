import { KUI_STORAGE_KEYS } from '../config/storage';
import { readStored, writeStored } from './gmStorage';
import { KuiAppState, EmbedRules } from '../types';


export const kuiState: KuiAppState = {
  isDebugModeEnabled: readStored(KUI_STORAGE_KEYS.DEBUG_MODE, false),
  isVerboseDebugEnabled: readStored(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false),
  isPreloadEnabled: readStored(KUI_STORAGE_KEYS.PRELOAD_IMAGES, false),
  isHideEmptySectionsEnabled: readStored(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, true),
  isPostPageModuleActive: false,
  embedRules: readStored<EmbedRules>(KUI_STORAGE_KEYS.EMBED_RULES, {}),
  sessionKey: readStored(KUI_STORAGE_KEYS.SESSION_KEY, "")
};

export function setDebugMode(enabled: boolean): void {
  kuiState.isDebugModeEnabled = enabled;
  writeStored(KUI_STORAGE_KEYS.DEBUG_MODE, enabled);
}

export function setVerboseDebugMode(enabled: boolean): void {
  kuiState.isVerboseDebugEnabled = enabled;
  writeStored(KUI_STORAGE_KEYS.VERBOSE_DEBUG, enabled);
}

export function setPreloadImages(enabled: boolean): void {
  kuiState.isPreloadEnabled = enabled;
  writeStored(KUI_STORAGE_KEYS.PRELOAD_IMAGES, enabled);
}

export function setHideEmptySections(enabled: boolean): void {
  kuiState.isHideEmptySectionsEnabled = enabled;
  writeStored(KUI_STORAGE_KEYS.HIDE_EMPTY_SECTIONS, enabled);
}

export function setEmbedRules(rules: EmbedRules): void {
  kuiState.embedRules = rules;
  writeStored(KUI_STORAGE_KEYS.EMBED_RULES, rules);
}

export function setSessionKey(key: string): void {
  kuiState.sessionKey = key;
  writeStored(KUI_STORAGE_KEYS.SESSION_KEY, key);
}
