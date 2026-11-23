import type { KdlModule } from '../core/types';
import { isModuleEnabled, setModuleEnabled } from '../core/registry';
import { css } from '../utils/cssBuilder';

// Ad slots rendered by the sites themselves: pawchive banners, kemono's TrafficStars units/interstitials.
// Hidden rather than removed, so kemono's React tree never trips over missing nodes.
const AD_SELECTORS = '.ad-container, .ad-container-slider, .ts-im-container, [id^="ts_ad_"]';

// pawchive's inline head script only injects its popunder when Date.now() - localStorage.lastPopunder >= 1h;
// a timestamp far in the future keeps that check failing on every later page load
const POPUNDER_KEY = 'lastPopunder';
const POPUNDER_BLOCKED_UNTIL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

function setPopunderBlocked(blocked: boolean): void {
  try {
    if (blocked) {
      localStorage.setItem(POPUNDER_KEY, String(Date.now() + POPUNDER_BLOCKED_UNTIL_MS));
    } else if (Number(localStorage.getItem(POPUNDER_KEY)) > Date.now() + 24 * 60 * 60 * 1000) {
      // Only undo our own far-future marker
      localStorage.removeItem(POPUNDER_KEY);
    }
  } catch (e) {}
}

export const adblockModule: KdlModule = {
  id: 'adblock',
  name: 'Hide ads',
  description: 'Hides the ad slots the sites render and blocks the pawchive popunder.',
  group: 'General',
  pages: 'any',
  defaultEnabled: false,
  styles: () => css({ [AD_SELECTORS]: { display: 'none !important' } }),
  mount() {
    setPopunderBlocked(true);
  },
  unmount() {
    setPopunderBlocked(false);
  }
};

// Kept for the UI settings panel toggle
export function isAdBlockEnabled(): boolean {
  return isModuleEnabled(adblockModule.id);
}

export function setAdBlockEnabled(enabled: boolean): void {
  setModuleEnabled(adblockModule.id, enabled);
}
