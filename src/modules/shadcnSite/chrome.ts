// Site chrome changes of the skin outside #main (the sidebar and the footer stay across htmx swaps):
// - the footer links ([Contact] [API]) become entries of the sidebar's Community section and the footer
//   bar is hidden; reversible (unmount, and before htmx stores a history snapshot, which copies <body>)
// - Logout asks first in a kit dialog instead of the browser's confirm()

import { icon, type IconName } from '../../config/icons';
import { detectSite } from '../../core/page';
import { t } from '../../i18n';
import { originalText } from '../../i18n/site';
import { button, dialog, type DialogHandle } from '../../ui/kit';
import { reversibleTransform } from './reversibleTransform';

const MARK = 'data-kdl-sk';
const COMMUNITY = 'community';
// On <html>, outside the snapshot: the skin's layout sheet hides the footer while it is set
const FOOTER_ATTR = 'data-kdl-sk-footer';

const FOOTER_ICONS: [RegExp, IconName][] = [
  [/^\/contact/, 'mail'],
  [/^\/api\//, 'code'],
];

function communityEntry(): HTMLElement | null {
  const bar = document.querySelector('.global-sidebar');
  if (!bar) return null;
  const bottom = bar.querySelector<HTMLElement>('.global-sidebar-entry.stuck-bottom');
  if (bottom) return bottom;
  // The header text may already be translated by i18n.site: read the site's original
  const headers = bar.querySelectorAll<HTMLElement>('.global-sidebar-entry > .global-sidebar-entry-item.header');
  return Array.from(headers).find((header) => /^\s*community\s*$/i.test(originalText(header)))?.parentElement ?? null;
}

/** The footer holds only links (and brackets/separators): hiding it loses nothing once they are moved */
function footerIsOnlyLinks(footer: Element, links: HTMLAnchorElement[]): boolean {
  let rest = footer.textContent || '';
  links.forEach((link) => (rest = rest.replace(link.textContent || '', '')));
  return !/[^\s[\]|·•\-–—]/.test(rest);
}

function sidebarItem(link: HTMLAnchorElement): HTMLAnchorElement {
  const href = link.getAttribute('href') || '/';
  const item = document.createElement('a');
  item.className = 'global-sidebar-entry-item';
  item.setAttribute(MARK, COMMUNITY);
  item.href = href;
  if (link.target) item.target = link.target;
  if (link.rel) item.rel = link.rel;
  const name = FOOTER_ICONS.find(([match]) => match.test(href))?.[1] ?? 'link';
  // The site's English text (without brackets): i18n.site translates the sidebar like the rest of it
  const label = (originalText(link) || link.textContent || '').trim().replace(/^\[\s*|\s*\]$/g, '');
  item.append(icon(name, 'global-sidebar-entry-item-icon'), document.createTextNode(label));
  // A plain click goes through the site's own (hidden, htmx-boosted) footer link. Were this copy the request's
  // element, the history snapshot taken before the swap would detach it (beforeSnapshot strips the copies), htmx
  // would lose the inherited hx-select and swap the whole response into #main. Nothing else may see the click
  // (htmx may have boosted the copy too, which would send a second request).
  item.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !link.isConnected) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // What the site does for its own sidebar links: the open sidebar of narrow screens closes
    const bar = item.closest('.global-sidebar');
    if (window.innerWidth <= 1020 && bar?.classList.contains('expanded')) bar.querySelector<HTMLElement>('.close-sidebar')?.click();
    link.click();
  });
  return item;
}

function moveFooterLinks(): void {
  if (document.querySelector(`.global-sidebar [${MARK}="${COMMUNITY}"]`)) return;
  const footer = document.querySelector('.global-footer');
  const entry = communityEntry();
  if (!footer || !entry) return;
  const links = Array.from(footer.querySelectorAll<HTMLAnchorElement>('a[href]'));
  if (!links.length || !footerIsOnlyLinks(footer, links)) return;
  // After the site's own entries, before a sponsored link (rel=nofollow) at the end
  const items = Array.from(entry.querySelectorAll<HTMLElement>(':scope > a.global-sidebar-entry-item'));
  const anchor = items.filter((item) => !/\bnofollow\b/.test(item.getAttribute('rel') || '')).pop()
    ?? entry.querySelector(':scope > .global-sidebar-entry-item.header');
  const nodes = links.map(sidebarItem);
  if (anchor) anchor.after(...nodes);
  else entry.append(...nodes);
  document.documentElement.setAttribute(FOOTER_ATTR, 'moved');
}

function restoreFooterLinks(): void {
  document.querySelectorAll(`[${MARK}="${COMMUNITY}"]`).forEach((node) => node.remove());
  document.documentElement.removeAttribute(FOOTER_ATTR);
}

/** Footer links in the sidebar's Community section; the footer bar hidden */
export const communityLinks = reversibleTransform(moveFooterLinks, restoreFooterLinks);

// Logout: the sidebar entry and the top bar link. The site asks with confirm() from an inline onclick;
// a plain click is taken first (window, capture) and asked in a kit dialog. Modified and middle clicks
// keep the browser's behaviour. Confirmed, the site's own link is clicked again (its listener clears the
// logged-in state kept in localStorage), without its inline confirm().
const LOGOUT = 'a[href^="/account/logout"]';
let confirmDialog: DialogHandle | null = null;
let proceeding = false;

function followLogout(link: HTMLAnchorElement): void {
  if (!link.isConnected) {
    window.location.assign(link.href);
    return;
  }
  const inline = link.getAttribute('onclick');
  link.removeAttribute('onclick');
  proceeding = true;
  try {
    link.click();
  } finally {
    proceeding = false;
    if (inline !== null) link.setAttribute('onclick', inline);
  }
}

function siteName(): string {
  const site = detectSite();
  return site.charAt(0).toUpperCase() + site.slice(1);
}

function confirmLogout(link: HTMLAnchorElement): void {
  if (confirmDialog?.isOpen()) return;
  const confirm = button({
    label: t('sk.logout.confirm'),
    icon: 'log-out',
    variant: 'destructive',
    onClick: () => {
      handle.close();
      followLogout(link);
    },
  });
  const handle: DialogHandle = dialog({
    title: t('sk.logout.title', { site: siteName() }),
    description: t('sk.logout.description'),
    size: 'sm',
    initialFocus: confirm,
    footer: [button({ label: t('settings.common.cancel'), variant: 'outline', onClick: () => handle.close() }), confirm],
    onClose: () => (confirmDialog = null),
  });
  handle.element.id = 'kdl-logout-confirm';
  confirmDialog = handle;
  handle.open();
}

function onLogoutClick(event: MouseEvent): void {
  if (proceeding || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>(LOGOUT);
  if (!link) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  confirmLogout(link);
}

/** Asks before logging out; returns the function that removes the interceptor */
export function installLogoutConfirm(): () => void {
  window.addEventListener('click', onLogoutClick, true);
  return () => {
    window.removeEventListener('click', onLogoutClick, true);
    confirmDialog?.close();
  };
}
