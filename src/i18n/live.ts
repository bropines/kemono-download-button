// What happens on screen when the language (or its pack) changes: the open settings dialog is rebuilt,
// injected buttons and panels are remounted; the site translation follows through its own module.
import { remountModules } from '../core/registry';
import { closeSettings, isSettingsOpen, openSettings } from '../ui/settings';
import { onLanguageChange } from './index';
import { scheduleTranslationUpdate } from './packs';

const NAV_LINK_IDS = ['kdl-settings-btn-sidebar', 'kdl-settings-btn-header'];

let installed = false;

export function installLanguageRuntime(): void {
  if (installed) return;
  installed = true;
  onLanguageChange(() => {
    // The core module re-adds these on its next update, in the new language
    NAV_LINK_IDS.forEach((id) => document.getElementById(id)?.remove());
    remountModules();
    if (isSettingsOpen()) {
      closeSettings();
      void openSettings('general');
    }
  });
  scheduleTranslationUpdate();
}
