// Collapsible sidebar sections: a click on a section heading ("Creators", "Posts", "Account"...) folds its links
// away like a tree branch, with a chevron. The folded set is remembered and lives as an attribute on <html>
// (set at document start too), so a folded section never flashes open on load; the hiding itself is CSS.
// The link of the current page stays visible inside a folded section.
// Our only nodes are the chevrons in the headings; clicks are handled by one delegated listener, so headings
// restored from an htmx history snapshot keep working.

import { readStored, writeStored } from '../../state/gmStorage';
import { t } from '../../i18n';

const STORE_KEY = 'ui.sidebar.collapsed';
const HTML_ATTR = 'data-kdl-sb-collapsed';
const KEY_ATTR = 'data-kdl-sb';
const CHEVRON = 'kdl-sb-chev';
const MAX_SECTIONS = 16;
const HEADING = '.global-sidebar > .global-sidebar-entry > .global-sidebar-entry-item.header';

const stored = (): string[] => String(readStored<string>(STORE_KEY, '') || '').split(/\s+/).filter(Boolean);

/** Puts the remembered folded set on <html> (document start and mount) */
export function syncCollapsedSections(): void {
  const value = stored().join(' ');
  if (value) document.documentElement.setAttribute(HTML_ATTR, value);
  else document.documentElement.removeAttribute(HTML_ATTR);
}

function keyOf(heading: Element): string {
  const entry = heading.parentElement!;
  return `s${Array.prototype.indexOf.call(entry.parentElement!.children, entry) + 1}`;
}

function toggle(heading: HTMLElement): void {
  const key = heading.getAttribute(KEY_ATTR) || keyOf(heading);
  const set = new Set(stored());
  if (set.has(key)) set.delete(key);
  else set.add(key);
  writeStored(STORE_KEY, [...set].join(' '));
  syncCollapsedSections();
  heading.setAttribute('aria-expanded', String(!set.has(key)));
  if (!set.has(key)) revealOpened(heading.parentElement);
}

// A section pinned to the bottom of the sidebar (Community) opens upwards: when its links would land below the
// visible part of the sidebar, the sidebar scrolls so the whole section shows, its heading moving up
function revealOpened(entry: Element | null): void {
  const bar = entry?.parentElement;
  if (!entry || !bar) return;
  requestAnimationFrame(() => {
    const overflow = entry.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom;
    if (overflow <= 1) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bar.scrollBy({ top: Math.ceil(overflow) + 8, behavior: smooth ? 'smooth' : 'auto' });
  });
}

/** Marks the headings (role, chevron); idempotent, so it can run on every update */
export function decorateSidebarSections(): void {
  const folded = new Set(stored());
  document.querySelectorAll<HTMLElement>(HEADING).forEach((heading) => {
    // A heading with nothing under it has nothing to fold
    if (!heading.parentElement?.querySelector(':scope > .global-sidebar-entry-item:not(.header)')) return;
    const key = keyOf(heading);
    heading.setAttribute(KEY_ATTR, key);
    heading.setAttribute('role', 'button');
    heading.tabIndex = 0;
    heading.setAttribute('aria-expanded', String(!folded.has(key)));
    heading.title = t('sidebar.toggleSection');
    if (!heading.querySelector(`.${CHEVRON}`)) {
      const chevron = document.createElement('span');
      chevron.className = CHEVRON;
      chevron.setAttribute('aria-hidden', 'true');
      heading.append(chevron);
    }
  });
}

export function undecorateSidebarSections(): void {
  document.querySelectorAll(`.${CHEVRON}`).forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>(`[${KEY_ATTR}]`).forEach((heading) => {
    heading.removeAttribute(KEY_ATTR);
    heading.removeAttribute('role');
    heading.removeAttribute('tabindex');
    heading.removeAttribute('aria-expanded');
    heading.removeAttribute('title');
  });
  document.documentElement.removeAttribute(HTML_ATTR);
}

function onClick(event: MouseEvent): void {
  const heading = (event.target as Element | null)?.closest?.<HTMLElement>(`[${KEY_ATTR}]`);
  if (!heading || event.button !== 0) return;
  event.preventDefault();
  toggle(heading);
}

function onKey(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const heading = (event.target as Element | null)?.closest?.<HTMLElement>(`[${KEY_ATTR}]`);
  if (!heading) return;
  event.preventDefault();
  toggle(heading);
}

/** Starts folding; returns the cleanup */
export function installSidebarSections(): () => void {
  syncCollapsedSections();
  decorateSidebarSections();
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    undecorateSidebarSections();
  };
}

const chevronMask = `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/** Skin CSS: heading affordance and the hiding of folded sections (one rule per possible position) */
export const sidebarSectionsCss = (): string => {
  const rules: string[] = [];
  for (let n = 1; n <= MAX_SECTIONS; n++) {
    const scope = `html[${HTML_ATTR}~="s${n}"] .global-sidebar > .global-sidebar-entry:nth-child(${n})`;
    rules.push(`${scope} > .global-sidebar-entry-item:not(.header):not([data-kdl-active]) { display: none !important; }`);
    rules.push(`${scope} > .global-sidebar-entry-item.header .${CHEVRON} { transform: rotate(-90deg); }`);
    // The section pinned to the bottom opens upwards: folded, its chevron points up
    rules.push(`${scope}.stuck-bottom > .global-sidebar-entry-item.header .${CHEVRON} { transform: rotate(180deg); }`);
  }
  return `
.global-sidebar-entry-item.header[${KEY_ATTR}] { cursor: pointer; user-select: none; border-radius: calc(var(--kdl-radius) - 2px); transition: color 0.15s ease, background-color 0.15s ease; }
.global-sidebar-entry-item.header[${KEY_ATTR}]:hover { color: var(--kdl-foreground); background: color-mix(in srgb, var(--kdl-accent) 60%, transparent); }
.global-sidebar-entry-item.header[${KEY_ATTR}]:focus-visible { outline: 2px solid var(--kdl-ring); outline-offset: -2px; }
.${CHEVRON} { flex: 0 0 auto; width: 14px; height: 14px; margin-left: auto; background: currentColor; opacity: 0.7; -webkit-mask: ${chevronMask} center / contain no-repeat; mask: ${chevronMask} center / contain no-repeat; transition: transform 0.15s ease; }
${rules.join('\n')}
`;
};
