import { KUI_STORAGE_KEYS } from '../config/storage';
import { css } from '../utils/cssBuilder';

// Ad slots rendered by the sites themselves: pawchive banners, kemono's TrafficStars units/interstitials.
// Hidden rather than removed, so kemono's React tree never trips over missing nodes.
const AD_SELECTORS = '.ad-container, .ad-container-slider, .ts-im-container, [id^="ts_ad_"]';
const STYLE_ID = 'kdl-adblock-styles';

// pawchive's inline head script only injects its popunder when Date.now() - localStorage.lastPopunder >= 1h;
// a timestamp far in the future keeps that check failing on every later page load
const POPUNDER_KEY = 'lastPopunder';
const POPUNDER_BLOCKED_UNTIL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export function isAdBlockEnabled(): boolean {
  return typeof GM_getValue === 'function' ? Boolean(GM_getValue(KUI_STORAGE_KEYS.HIDE_ADS, true)) : true;
}

export function setAdBlockEnabled(enabled: boolean): void {
  if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.HIDE_ADS, enabled);
  applyAdBlock(enabled);
}

export function applyAdBlock(enabled = isAdBlockEnabled()): void {
  const existingStyle = document.getElementById(STYLE_ID);

  try {
    if (enabled) {
      localStorage.setItem(POPUNDER_KEY, String(Date.now() + POPUNDER_BLOCKED_UNTIL_MS));
    } else if (Number(localStorage.getItem(POPUNDER_KEY)) > Date.now() + 24 * 60 * 60 * 1000) {
      // Only undo our own far-future marker
      localStorage.removeItem(POPUNDER_KEY);
    }
  } catch (e) {}

  if (!enabled) {
    existingStyle?.remove();
    return;
  }
  if (existingStyle) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css({ [AD_SELECTORS]: { display: 'none !important' } });
  (document.head || document.documentElement).appendChild(style);
}
