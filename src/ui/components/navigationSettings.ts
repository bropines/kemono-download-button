import { icon } from '../../config/icons';
import { openSettings } from '../settings';

const SIDEBAR_ID = 'kdl-settings-btn-sidebar';
const HEADER_ID = 'kdl-settings-btn-header';
// Links from versions that had separate Downloader / UI settings
const LEGACY_IDS = ['kui-settings-btn-sidebar', 'kui-settings-btn-header'];

function settingsLink(id: string, className: string, withIcon: boolean): HTMLAnchorElement {
  const link = document.createElement('a');
  link.id = id;
  link.className = className;
  link.href = '#';
  link.title = 'Kemono DL settings';
  if (withIcon) {
    const svg = icon('settings', 'global-sidebar-entry-item-icon');
    Object.assign(svg.style, { width: '1rem', height: '1rem', marginRight: '0.5rem', flexShrink: '0', verticalAlign: 'middle' });
    link.append(svg);
  }
  link.append('Settings');
  return link;
}

// Delegated from document: htmx history snapshots bring the links back as plain markup without listeners
let delegated = false;
function delegateClicks(): void {
  if (delegated) return;
  delegated = true;
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target || typeof target.closest !== 'function' || !target.closest(`#${SIDEBAR_ID}, #${HEADER_ID}`)) return;
    e.preventDefault();
    openSettings();
  });
}

/**
 * Adds one "Settings" link to the global sidebar (its own section, above the bottom entries)
 * and to the top header. Idempotent: re-run after every HTMX swap.
 */
export function setupNavigationSettings(): void {
  delegateClicks();
  LEGACY_IDS.forEach((id) => document.getElementById(id)?.remove());

  const sidebar = document.querySelector('.global-sidebar');
  if (sidebar) {
    sidebar.querySelectorAll(`#${HEADER_ID}, .global-sidebar-entry.account #${SIDEBAR_ID}`).forEach((n) => n.remove());
    let group = sidebar.querySelector('.kdl-settings-sidebar-entry');
    if (!group) {
      group = document.createElement('div');
      group.className = 'global-sidebar-entry kdl-settings-sidebar-entry';
      const stuckBottom = sidebar.querySelector('.global-sidebar-entry.stuck-bottom');
      if (stuckBottom) stuckBottom.before(group);
      else sidebar.appendChild(group);
    }
    // the section header of older versions
    group.querySelector('.global-sidebar-entry-item.header')?.remove();
    const existing = document.getElementById(SIDEBAR_ID);
    if (!existing || !group.contains(existing)) {
      existing?.remove();
      group.appendChild(settingsLink(SIDEBAR_ID, 'global-sidebar-entry-item', true));
    }
  }

  const topHeader = Array.from(document.querySelectorAll<HTMLElement>('.header')).find(
    (n) => !n.closest('.global-sidebar') && !n.classList.contains('global-sidebar-entry-item')
  );
  if (topHeader && !topHeader.querySelector(`#${HEADER_ID}`)) {
    document.getElementById(HEADER_ID)?.remove();
    const insertTarget =
      topHeader.querySelector('a.logout') ||
      topHeader.querySelector('a.login') ||
      topHeader.querySelector('a.register') ||
      topHeader.querySelector('a.account') ||
      topHeader.querySelector('a.logged-in-only') ||
      topHeader.querySelector('a.logged-out-only') ||
      topHeader.querySelector('a.header-link:last-of-type');
    const link = settingsLink(HEADER_ID, 'header-link kdl-settings-header-link', false);
    if (insertTarget) topHeader.insertBefore(link, insertTarget);
    else topHeader.appendChild(link);
  }
}
