// Collapsible blocks under a creator's tabs (similar creators, and the announcement, tags and linked accounts of the
// overview): a chevron at the end of the block's head folds its body away, remembered per block in GM storage
// (booleans, so AdGuard keeps them). The placeholders read the same state, so a folded block is folded from the
// page's first frame.

import { readStored, writeStored } from '../../state/gmStorage';
import { button, kitIcon } from '../../ui/kit';
import { t } from '../../i18n';
import { COLLAPSE_CLASS } from './order';

export { COLLAPSE_CLASS };

/** On the block (and its placeholder) while folded */
export const COLLAPSED_ATTR = 'data-collapsed';

export const isCollapsed = (key: string): boolean => readStored<boolean>(key, false) === true;

/** A chevron button that folds `block` (the CSS hides what is not its head) and remembers it under `key` */
export function collapseToggle(block: HTMLElement, key: string, section: string): HTMLButtonElement {
  const toggle = button({ variant: 'ghost', size: 'icon', className: COLLAPSE_CLASS }) as HTMLButtonElement;
  const apply = (collapsed: boolean): void => {
    block.toggleAttribute(COLLAPSED_ATTR, collapsed);
    toggle.replaceChildren(kitIcon(collapsed ? 'chevron-down' : 'chevron-up'));
    const label = t(collapsed ? 'blocks.expand' : 'blocks.collapse', { section });
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = label;
  };
  toggle.addEventListener('click', (event) => {
    // The head of an overview section is not a link, but a click must never reach one around it
    event.preventDefault();
    const next = !block.hasAttribute(COLLAPSED_ATTR);
    writeStored(key, next);
    apply(next);
  });
  apply(isCollapsed(key));
  return toggle;
}

