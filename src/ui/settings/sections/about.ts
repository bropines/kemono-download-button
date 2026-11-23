// "About" card at the end of the General tab: name, version, project links and the donation links.
// A card rather than its own tab: the seven tabs already fill one row of the dialog on desktop.

import { CREATOR_LINKS_REPO_URL, DONATE_LINKS, PROJECT_REPO_URL } from '../../../config/constants';
import type { IconName } from '../../../config/icons';
import { t } from '../../../i18n';
import { el } from '../../../utils/dom';
import { badge, button } from '../../kit';
import { section } from '../controls';

import { scriptVersion } from '../../../utils/version';

export { scriptVersion };

const linkButton = (label: string, href: string, icon: IconName): HTMLAnchorElement =>
  button({ label, href, icon, target: '_blank', variant: 'outline', size: 'sm' });

function projectLinks(): HTMLElement {
  return el('div', { className: 'kdl-settings__row kdl-settings__about-links' }, [
    linkButton(t('settings.about.link.github'), PROJECT_REPO_URL, 'github'),
    linkButton(t('settings.about.link.releases'), `${PROJECT_REPO_URL}/releases`, 'tag'),
    linkButton(t('settings.about.link.changelog'), `${PROJECT_REPO_URL}/blob/main/CHANGELOG.md`, 'scroll-text'),
    linkButton(t('settings.about.link.bug'), `${PROJECT_REPO_URL}/issues/new`, 'bug'),
    linkButton(t('settings.about.link.translations'), `${PROJECT_REPO_URL}/blob/main/locales/README.md`, 'languages'),
    linkButton(t('settings.about.link.creatorLinks'), CREATOR_LINKS_REPO_URL, 'database'),
  ]);
}

function donateBlock(): HTMLElement | null {
  if (!DONATE_LINKS.length) return null;
  return el('div', { className: 'kdl-settings__about-donate' }, [
    el('div', { className: 'kdl-settings__about-subtitle', textContent: t('settings.about.donate.title') }),
    el('p', { className: 'kdl-settings__note', textContent: t('settings.about.donate.description') }),
    el('div', { className: 'kdl-settings__row' }, DONATE_LINKS.map((link) => linkButton(link.label, link.url, link.icon ?? 'heart'))),
  ]);
}

/** The About card for the General tab. */
export function aboutSection(): HTMLElement {
  const version = scriptVersion();
  const head = el('div', { className: 'kdl-settings__about-head' }, [
    el('span', { className: 'kdl-settings__about-name', textContent: t('settings.about.name') }),
    version ? badge({ text: `v${version}`, variant: 'secondary' }) : null,
  ]);
  const whatsNew = version
    ? button({
        label: t('settings.about.whatsNew', { version }),
        // Test builds count up from x.y.90 and have no release of their own: the changelog then
        href: /^\d+\.\d+\.(9\d|\d{3,})$/.test(version) ? `${PROJECT_REPO_URL}/blob/main/CHANGELOG.md` : `${PROJECT_REPO_URL}/releases/tag/v${version}`,
        target: '_blank',
        icon: 'sparkles',
        variant: 'link',
        size: 'sm',
        className: 'kdl-settings__about-news',
      })
    : null;
  const node = section(t('settings.about.section'), [
    el('div', { className: 'kdl-settings__about-intro' }, [
      head,
      el('p', { className: 'kdl-settings__note', textContent: t('settings.about.description') }),
      whatsNew,
    ]),
    projectLinks(),
    donateBlock(),
  ], { icon: 'package' });
  node.id = 'kdl-settings-about';
  return node;
}
