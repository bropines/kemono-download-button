// Links the script adds (similar creators, the creator overview, info badges, our menus) are put in after htmx
// went over the page, so htmx does not boost them: a click on one reloaded the whole page instead of swapping
// it in like the site's own links (no skeleton, no transition, everything set up again).
//
// The site's htmx is private to its bundle, so it cannot be asked to process our links. Instead, a plain click
// on a link htmx left alone is handed to a link it did boost (one in the sidebar), and the request it makes is
// pointed at our link's address in htmx:configRequest, which htmx documents as the place to change the path.
// Should that not take (the change not seen by htmx), the request is cancelled and the browser follows the
// link as before.

const PENDING_MS = 1000;
// Same-origin addresses that are files or endpoints, not pages
const NOT_A_PAGE = /^\/(data|thumbnail|api|static|icons|banners)\/|\.[a-z0-9]{2,5}$/i;

let pending: { proxy: Element; path: string; at: number } | null = null;

function proxyLink(): HTMLAnchorElement | null {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]:not([hx-boost="false"]):not(.logout):not([download])');
  for (const link of Array.from(links)) {
    if (link.closest('#main, [hx-boost="false"]')) continue;
    // Boosted by htmx (its data is on the element where the script shares the page's world)
    const data = (link as unknown as Record<string, { boosted?: boolean } | undefined>)['htmx-internal-data'];
    if (data?.boosted) return link;
  }
  return null;
}

function pageLink(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
  // href="#" and other in-page anchors are script buttons, not pages (new URL('#') has an empty hash)
  if (link.getAttribute('href')?.startsWith('#')) return null;
  if (link.closest('[hx-boost="false"]') || link.hasAttribute('hx-get') || link.hasAttribute('hx-post')) return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol) || NOT_A_PAGE.test(url.pathname)) return null;
  // A jump within this page
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null;
  return link;
}

/** Plain clicks on links htmx did not boost navigate the way boosted ones do */
export function installLinkBoost(): void {
  if (document.body?.getAttribute('hx-boost') !== 'true') return;
  // Bubbling on window: after htmx (which prevents the default of the links it boosts) and our own handlers
  window.addEventListener('click', (event) => {
    const link = pageLink(event);
    if (!link) return;
    const proxy = proxyLink();
    if (!proxy) return;
    const url = new URL(link.href, window.location.href);
    event.preventDefault();
    pending = { proxy, path: url.pathname + url.search + url.hash, at: Date.now() };
    proxy.click();
    // htmx asks for its config while handling the click: nothing asked means it did not take the click
    if (pending) {
      pending = null;
      window.location.assign(url.href);
    }
  });
  document.addEventListener(
    'htmx:configRequest',
    (event) => {
      const detail = (event as CustomEvent).detail as { elt?: Element; path?: string } | null;
      const request = pending;
      if (!request || !detail || detail.elt !== request.proxy) return;
      pending = null;
      if (Date.now() - request.at > PENDING_MS) return;
      detail.path = request.path;
      if (detail.path !== request.path) {
        // The change did not reach htmx: do not let it load the sidebar link's page
        event.preventDefault();
        window.location.assign(request.path);
      }
    },
    true,
  );
}
