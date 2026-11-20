// The optional "no flash on load" userstyle (extras/kdl-preload.user.css). Userscript managers inject scripts
// late (Tampermonkey: after the page is painted), style managers apply styles from the first frame, so the
// style hides #main until the script marks <html data-kdl-ready>. There is no Stylus API to install a style:
// opening a *.user.css URL is enough, Stylus intercepts it and shows its own install page. The style sets
// --kdl-preload on <html>, which is how an installed copy is detected.

import { el } from '../../utils/dom';
import { badge, button } from '../kit';
import { t } from '../../i18n';

export const PRELOAD_STYLE_URL = 'https://raw.githubusercontent.com/bropines/kemono-download-button/main/extras/kdl-preload.user.css';
export const STYLUS_URL = 'https://github.com/openstyles/stylus#readme';

/** The style is active on this page */
export function isPreloadStyleInstalled(): boolean {
  return getComputedStyle(document.documentElement).getPropertyValue('--kdl-preload').trim() === '1';
}

/** Style managers are desktop browser extensions: AdGuard (no GM_download, Android too) has none to offer */
export function canOfferPreloadStyle(): boolean {
  return typeof GM_download === 'function';
}

/** Status badge, or the install button plus a link to Stylus; re-checked when the user comes back to the tab */
export function preloadStyleControl(): HTMLElement {
  const holder = el('div', { className: 'kdl-preload-style' });
  const render = (): void => {
    if (isPreloadStyleInstalled()) {
      holder.replaceChildren(badge({ text: t('preload.installed'), icon: 'check', variant: 'secondary' }));
      return;
    }
    holder.replaceChildren(
      button({ label: t('preload.install'), icon: 'download', variant: 'secondary', size: 'sm', href: PRELOAD_STYLE_URL, target: '_blank' }),
      button({ label: t('preload.getStylus'), icon: 'external-link', variant: 'ghost', size: 'sm', href: STYLUS_URL, target: '_blank' })
    );
  };
  render();
  const recheck = (): void => {
    if (!holder.isConnected) {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
      return;
    }
    if (document.visibilityState === 'visible') render();
  };
  window.addEventListener('focus', recheck);
  document.addEventListener('visibilitychange', recheck);
  return holder;
}
