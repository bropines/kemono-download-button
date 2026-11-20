// The optional "no flash on load" userstyle (extras/kdl-preload.user.css). Userscript managers inject scripts
// late (Tampermonkey: after the page is painted), style managers apply styles from the first frame, so the
// style hides #main until the script marks <html data-kdl-ready>. There is no Stylus API to install a style:
// opening a *.user.css URL is enough, Stylus intercepts it and shows its own install page (and its update
// page for a newer version). The style sets --kdl-preload on <html> to its revision: that is how an installed
// copy, and an outdated one, is detected.

import { el } from '../../utils/dom';
import { badge, button } from '../kit';
import { t } from '../../i18n';

export const PRELOAD_STYLE_URL = 'https://raw.githubusercontent.com/bropines/kemono-download-button/main/extras/kdl-preload.user.css';
export const STYLUS_URL = 'https://github.com/openstyles/stylus#readme';

/** The revision of the style this build generates (scripts/postbuild.mjs PRELOAD_STYLE_REVISION) */
export const PRELOAD_STYLE_REVISION = 3;

/** Revision of the style active on this page; 0 when it is not installed (or switched off) */
export function installedPreloadRevision(): number {
  const value = Number(getComputedStyle(document.documentElement).getPropertyValue('--kdl-preload').trim());
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** The style is active on this page (any revision) */
export function isPreloadStyleInstalled(): boolean {
  return installedPreloadRevision() > 0;
}

export function isPreloadStyleOutdated(): boolean {
  const revision = installedPreloadRevision();
  return revision > 0 && revision < PRELOAD_STYLE_REVISION;
}

/** Style managers are desktop browser extensions: AdGuard (no GM_download, Android too) has none to offer */
export function canOfferPreloadStyle(): boolean {
  return typeof GM_download === 'function';
}

/** Status badge, or the install button plus a link to Stylus; re-checked when the user comes back to the tab */
export function preloadStyleControl(): HTMLElement {
  const holder = el('div', { className: 'kdl-preload-style' });
  const render = (): void => {
    if (isPreloadStyleOutdated()) {
      holder.replaceChildren(
        badge({ text: t('preload.outdated'), icon: 'triangle-alert', variant: 'outline' }),
        button({ label: t('preload.update'), icon: 'refresh-cw', variant: 'secondary', size: 'sm', href: PRELOAD_STYLE_URL, target: '_blank' })
      );
      return;
    }
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
