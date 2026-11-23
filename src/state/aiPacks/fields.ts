import type { DownloaderSettings } from '../../types';
import type { AiField } from '../aiPack';
import { isSecretSetting, isValidSetting } from '../settingsSchema';
import { saveSetting, state } from '../store';

/** A downloader setting as a pack field: validated by settingsSchema, saved like the dialog saves it */
export function settingField(key: keyof DownloaderSettings, normalize?: (value: any) => unknown): AiField {
  // A pack is shareable by design: a secret can never become one of its fields
  if (isSecretSetting(key)) throw new Error(`secret setting ${key} in an AI pack`);
  return {
    key,
    get: () => state.settings[key],
    set: async (value) => {
      if (!isValidSetting(key, value)) return false;
      await saveSetting(key, (normalize ? normalize(value) : value) as DownloaderSettings[typeof key]);
      return true;
    },
  };
}

/** Markdown lines "- `key`: text (default `x`)" for the downloader settings a prompt documents */
export const fieldDoc = (key: keyof DownloaderSettings, text: string, defaults: DownloaderSettings): string =>
  `- \`${key}\`: ${text} Default: ${JSON.stringify(defaults[key])}.`;
