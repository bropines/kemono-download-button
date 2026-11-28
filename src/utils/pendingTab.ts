/**
 * A tab that is asked for now and told where to go later.
 *
 * An address that exists only after a request has answered arrives when the click that asked for it is
 * spent, and a browser calls a tab opened then a popup. So `openPendingTab` runs inside the click handler,
 * before the first await, and `go` runs when the address is known.
 */
export interface PendingTab {
  /** Sends the tab to its address. False when there is no tab: the caller then shows the address as a link. */
  go(url: string): boolean;
  /** The address never came: closes the tab. */
  cancel(): void;
}

export function openPendingTab(waiting: string): PendingTab {
  let tab: Window | null = null;
  try {
    // Not "noopener" in the feature string: with it the call returns null whether or not a tab opened
    tab = window.open('', '_blank');
  } catch {
    tab = null;
  }
  if (tab) {
    try {
      tab.opener = null;
      // A blank page for the length of an upload reads as something broken
      tab.document.title = waiting;
      tab.document.body.textContent = waiting;
    } catch {
      // Cosmetic
    }
  }
  return {
    go(url) {
      if (!tab || tab.closed) return false;
      try {
        // A link clicked inside the blank tab makes that tab the source of the navigation, and noreferrer
        // sends no Referer at all. Assigning the location would name this page as where the visit came from
        const link = tab.document.createElement('a');
        link.href = url;
        link.rel = 'noreferrer';
        tab.document.body.appendChild(link);
        link.click();
        return true;
      } catch {
        try {
          tab.location.href = url;
          return true;
        } catch {
          return false;
        }
      }
    },
    cancel() {
      try {
        tab?.close();
      } catch {
        // Not ours to close any more
      }
    },
  };
}
