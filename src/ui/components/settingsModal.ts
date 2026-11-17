// Entry points kept for callers of the old "Downloader settings" modal; the UI is the Settings dialog.
import { closeSettings, isSettingsOpen, openSettings, refreshSettings, type SettingsTab } from '../settings';

/** Opens (true), closes (false) or toggles the Settings dialog. */
export async function toggleSettingsModal(forceShow?: boolean, tab?: SettingsTab): Promise<void> {
  const show = typeof forceShow === 'boolean' ? forceShow : !isSettingsOpen();
  if (show) await openSettings(tab);
  else closeSettings();
}

/** The dialog is built on open; nothing to create ahead of time. */
export function createSettingsModal(): void {}

/** Re-reads every value into the open dialog. */
export function updateSettingsModalUI(): void {
  refreshSettings();
}
