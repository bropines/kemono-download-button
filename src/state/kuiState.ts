import { KUI_STORAGE_KEYS } from '../config/storage';
import { readStored, writeStored } from './gmStorage';
import { readModuleValue, writeModuleValue } from '../core/storage';
import { KuiAppState, EmbedRules } from '../types';


export const kuiState: KuiAppState = {
  isDebugModeEnabled: readStored(KUI_STORAGE_KEYS.DEBUG_MODE, false),
  isVerboseDebugEnabled: readStored(KUI_STORAGE_KEYS.VERBOSE_DEBUG, false),
  // Owned by the kui.post module (migrated from kui_preload_images / kui_hide_empty_sections)
  isPreloadEnabled: readModuleValue('kui.post', 'preloadImages', false),
  isHideEmptySectionsEnabled: readModuleValue('kui.post', 'hideEmptySections', true),
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
  writeModuleValue('kui.post', 'preloadImages', enabled);
}

export function setHideEmptySections(enabled: boolean): void {
  kuiState.isHideEmptySectionsEnabled = enabled;
  writeModuleValue('kui.post', 'hideEmptySections', enabled);
}

export function setEmbedRules(rules: EmbedRules): void {
  kuiState.embedRules = rules;
  writeStored(KUI_STORAGE_KEYS.EMBED_RULES, rules);
}

export function setSessionKey(key: string): void {
  kuiState.sessionKey = key;
  writeStored(KUI_STORAGE_KEYS.SESSION_KEY, key);
}
