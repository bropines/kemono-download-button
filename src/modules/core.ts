import type { KdlModule } from '../core/types';
import { onPageChange } from '../core/router';
import { CSS_STYLES } from '../config/styles';
import { appState } from '../state/store';
import { debugLog } from '../utils/helpers';
import { debugModule } from '../utils/logger';
import { createFixedControls } from '../ui/components/fixedControls';
import { setupNavigationSettings } from '../ui/components/navigationSettings';
import { injectUI } from '../ui/components/kui/settingsPanel';
import { toggleSettingsModal } from '../ui/components/settingsModal';
import { lightboxModule } from '../features/kui/lightbox';

const STYLE_ID = 'kdl-global-styles';
let stylesInjected = false;
let styleElement: HTMLStyleElement | null = null;

export function ensureStylesInjected(): void {
  if (stylesInjected) {
    // Re-attach our own node if the page dropped it, never inject a second copy
    if (styleElement && !styleElement.isConnected) (document.head || document.documentElement).appendChild(styleElement);
    return;
  }
  stylesInjected = true;

  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    styleElement = existing;
    return;
  }

  if (typeof GM_addStyle === 'function') {
    try {
      const result = GM_addStyle(CSS_STYLES) as unknown;
      // Some hosts return nothing: find the node they added so it still gets the id
      styleElement =
        result instanceof HTMLStyleElement
          ? result
          : Array.from(document.querySelectorAll('style')).find((node) => node.textContent === CSS_STYLES) || null;
      if (styleElement) styleElement.id = STYLE_ID;
      return;
    } catch (error) {
      debugLog('GM_addStyle failed, falling back to a <style> element:', error);
    }
  }

  styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = CSS_STYLES;
  (document.head || document.documentElement).appendChild(styleElement);
}

// Settings stay reachable from the userscript manager menu even when the page layout hides our buttons
function registerMenuCommands(): void {
  if (typeof GM_registerMenuCommand !== 'function') return;
  GM_registerMenuCommand('Download settings', () => toggleSettingsModal(true));
  GM_registerMenuCommand('UI settings', () => document.getElementById('kui-settings-panel')?.classList.add('kui-panel-active'));
}

// A new pathname is a different post/creator/list: drop page-scoped download state
function resetPageState(): void {
  appState.cachedPostFiles = null;
  appState.originalPostContentHTML = null;
}

// Floating controls and panels live on <body>, outside #main, and are only re-added when missing
function ensureGlobalUi(): void {
  ensureStylesInjected();
  injectUI();
  setupNavigationSettings();
  createFixedControls();
}

export const coreModule: KdlModule = {
  id: 'core',
  name: 'Core',
  description: 'Styles, settings panels and links, floating controls, lightbox, menu commands.',
  group: 'General',
  pages: 'any',
  defaultEnabled: true,
  locked: true,
  setup() {
    ensureStylesInjected();
    debugModule.init();
    injectUI();
    lightboxModule.init();
    registerMenuCommands();
    onPageChange(resetPageState);
  },
  mount: ensureGlobalUi,
  update: ensureGlobalUi
};
