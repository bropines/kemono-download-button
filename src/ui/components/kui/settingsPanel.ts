// The old "UI settings" panel is now the Interface tab of the Settings dialog.
import { openSettings } from '../../settings';

const SHIM_ID = 'kui-settings-panel';
const ACTIVE_CLASS = 'kui-panel-active';

/** Opens the Settings dialog on the Interface tab. */
export function openInterfaceSettings(): void {
  openSettings('interface');
}

/**
 * Keeps a hidden #kui-settings-panel on document.body for code that still opens the old panel by
 * adding .kui-panel-active to it (index.ts menu command): the class opens the dialog on the Interface tab.
 */
export function injectUI(): void {
  if (document.getElementById(SHIM_ID)) return;
  const shim = document.createElement('div');
  shim.id = SHIM_ID;
  shim.hidden = true;
  new MutationObserver(() => {
    if (!shim.classList.contains(ACTIVE_CLASS)) return;
    shim.classList.remove(ACTIVE_CLASS);
    openInterfaceSettings();
  }).observe(shim, { attributes: true, attributeFilter: ['class'] });
  document.body.appendChild(shim);
}
