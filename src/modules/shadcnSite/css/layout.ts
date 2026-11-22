// Sidebar, top header, content padding, page headings and the footer.
// Widths and the header height stay the site's: its own media queries slide them in and out.

import { NK } from './base';

// Lucide icons for the top bar links, drawn as masks in the text colour
const svg = (paths: string): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${paths}</svg>`)}")`;
const HEADER_ICONS: [string, string][] = [
  ['[href="/"]', svg("<path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'/><path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/>")],
  ['[href^="/artists"]', svg("<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/>")],
  ['[href^="/posts"]', svg("<rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/>")],
  ['[href^="/importer"]', svg("<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><path d='M17 8l-5-5-5 5'/><path d='M12 3v12'/>")],
  ['[href^="/account/register"]', svg("<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M19 8v6'/><path d='M22 11h-6'/>")],
  ['[href^="/account/login"]', svg("<path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'/><path d='m10 17 5-5-5-5'/><path d='M15 12H3'/>")],
  ['[href^="/favorites"]', svg("<path d='M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'/>")],
  ['#kdl-settings-btn-header', svg("<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'/><circle cx='12' cy='12' r='3'/>")],
  ['[href^="/account/logout"]', svg("<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><path d='m16 17 5-5-5-5'/><path d='M21 12H9'/>")],
];
const LOGOUT = '[href^="/account/logout"]';
const LOGOUT_ICON = HEADER_ICONS.find(([match]) => match === LOGOUT)![1];
// Links the site adds later get a plain link icon
const LINK_ICON = svg("<path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/><path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/>");
const headerIconsCss = (): string =>
  HEADER_ICONS.map(([match, icon]) => `.content-wrapper .header > a.header-link${match}::before { -webkit-mask-image: ${icon}; mask-image: ${icon}; }`).join(' ');

const ITEM_HOVER = [
  '.global-sidebar-entry-item:not(.header):hover',
  '.global-sidebar-entry-item.clickable-header:hover',
  '.global-sidebar-entry-item:not(.header):focus',
  '.global-sidebar-entry-item.clickable-header:focus',
].join(', ');

export const layoutCss = (): string => `
/* Sidebar */
.global-sidebar {
  padding: 8px 0;
  border-right: 1px solid var(--kdl-border);
  background: var(--kdl-sidebar);
  color: var(--kdl-foreground);
  font-size: 14px;
  scrollbar-width: none;
}
.global-sidebar-entry { gap: 1px; margin: 0 8px; padding: 6px 0; }
.global-sidebar-entry.stuck-bottom { margin-top: auto; }
.global-sidebar-entry.clickable-header-entry { padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px solid var(--kdl-border); }
.global-sidebar-entry-item {
  gap: 8px;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: calc(var(--kdl-radius) - 2px);
  color: color-mix(in srgb, var(--kdl-foreground) 82%, transparent);
  font-weight: 400;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.global-sidebar-entry-item:not(.header):not(.clickable-header) { padding-left: 0.5rem; }
.global-sidebar-entry-item-icon {
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-right: 0;
  opacity: 0.7;
}
.global-sidebar-entry-item.header {
  height: 2rem;
  color: var(--kdl-muted-foreground);
  font-size: 12px;
  font-weight: 500;
  cursor: default;
}
.global-sidebar-entry-item.header > .global-sidebar-entry-item-icon { display: none; }
.global-sidebar-entry-item.home-button { font-size: 15px; font-weight: 600; color: var(--kdl-foreground); }
.global-sidebar-entry-item.home-button > .global-sidebar-entry-item-icon { opacity: 1; }
.global-sidebar-entry-item.account-header { color: var(--kdl-muted-foreground); font-size: 12px; font-weight: 500; }
.global-sidebar-entry-item.account-header > .global-sidebar-entry-item-icon { display: none; }
${ITEM_HOVER} {
  background: var(--kdl-accent);
  color: var(--kdl-accent-foreground);
}
.global-sidebar-entry-item:hover > .global-sidebar-entry-item-icon { opacity: 1; }
.global-sidebar-entry-item[data-kdl-active] {
  background: var(--kdl-accent);
  box-shadow: inset 2px 0 0 var(--kdl-primary);
  color: var(--kdl-accent-foreground);
  font-weight: 500;
}
.global-sidebar-entry-item[data-kdl-active] > .global-sidebar-entry-item-icon { opacity: 1; }
.global-sidebar-entry .close-sidebar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  margin-left: 8px;
  border-radius: calc(var(--kdl-radius) - 2px);
  transition: background-color 0.15s ease;
}
.global-sidebar-entry .close-sidebar > img { width: 1rem; height: 1rem; opacity: 0.7; }
.global-sidebar-entry .close-sidebar:is(:hover, :focus) { background: var(--kdl-accent); }
#kdl-settings-btn-sidebar > svg { margin-right: 0 !important; opacity: 0.7; }
/* Logout: last in the account section, under a rule, in the danger colour (asks first, see chrome.ts) */
.global-sidebar-entry-item${LOGOUT} { position: relative; margin-top: 9px; color: var(--kdl-danger); }
.global-sidebar-entry-item${LOGOUT}::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 0.5rem;
  right: 0.5rem;
  height: 1px;
  background: var(--kdl-border);
  pointer-events: none;
}
.global-sidebar-entry-item${LOGOUT} > img.global-sidebar-entry-item-icon { display: none; }
.global-sidebar-entry-item${LOGOUT}::before {
  content: '';
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  background: currentColor;
  -webkit-mask: ${LOGOUT_ICON} center / contain no-repeat;
  mask: ${LOGOUT_ICON} center / contain no-repeat;
}
.global-sidebar-entry-item${LOGOUT}:is(:hover, :focus),
.content-wrapper .header > a.header-link${LOGOUT}:is(:hover, :focus-visible) {
  background: color-mix(in srgb, var(--kdl-danger) 14%, transparent);
  color: var(--kdl-danger);
}
.content-wrapper .header > a.header-link${LOGOUT} { color: var(--kdl-danger); }
/* The footer links live in the Community section (chrome.ts): no footer bar left */
html[data-kdl-sk-footer="moved"] .content-wrapper > .global-footer { display: none; }

/* Top header (shown on narrow screens, or with the sidebar retracted) */
.content-wrapper .header {
  gap: 2px;
  padding: 0 12px 0 8px;
  border-bottom: 1px solid var(--kdl-border);
  background: color-mix(in srgb, var(--kdl-sidebar) 88%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  font-size: 14px;
}
.content-wrapper .header #burgor {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  min-width: 0;
  height: 2rem;
  padding: 0;
  border-radius: calc(var(--kdl-radius) - 2px);
  transition: background-color 0.15s ease;
}
.content-wrapper .header #burgor > img { width: 1.125rem; height: 1.125rem; }
.content-wrapper .header #burgor:hover { background: var(--kdl-accent); }
.content-wrapper .header-link {
  height: 2rem;
  padding: 0 0.625rem;
  border-radius: calc(var(--kdl-radius) - 2px);
  color: var(--kdl-muted-foreground);
  font-weight: 500;
  white-space: nowrap;
}
.content-wrapper .header-link:first-of-type { margin-left: 8px; }
.content-wrapper .header-link:is(:hover, :focus-visible) { background: var(--kdl-accent); color: var(--kdl-foreground); }
/* Narrow screens: the links scroll sideways instead of being dropped (the site hides Import, Home, Login);
   the menu button scrolls with them */
@media (max-width: 1020px) {
  .content-wrapper .header {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .content-wrapper .header::-webkit-scrollbar { display: none; }
  .content-wrapper .header > .header-link { display: flex; flex: 0 0 auto; height: 2.25rem; }
  .content-wrapper .header #burgor { flex: 0 0 auto; width: 2.25rem; height: 2.25rem; }
}
/* Top bar link icons; Icons only hides the text (kept for screen readers and as a tooltip) */
.content-wrapper .header > a.header-link { gap: 6px; }
.content-wrapper .header > a.header-link::before {
  content: '';
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  background: currentColor;
  -webkit-mask: ${LINK_ICON} center / contain no-repeat;
  mask: ${LINK_ICON} center / contain no-repeat;
  opacity: 0.85;
}
${headerIconsCss()}
html[data-kdl-sk-hlabels="text"] .content-wrapper .header > a.header-link::before { display: none; }
/* The hidden text is still an anonymous flex item: without zero gap it shifts the icon left. */
html[data-kdl-sk-hlabels="icons"] .content-wrapper .header > a.header-link { width: 2.25rem; padding: 0; gap: 0; justify-content: center; font-size: 0; }
html[data-kdl-sk-hlabels="icons"] .content-wrapper .header > a.header-link::before { width: 1.125rem; height: 1.125rem; }
html[data-kdl-sk-hlabels="icons"] .content-wrapper .header > a.header-link:first-of-type { margin-left: 4px; }
/* Automatic mode keeps labels on desktop and uses compact icons on narrow phones. Explicit choices win. */
@media (max-width: 600px) {
  html[data-kdl-sk-hlabels="auto"] .content-wrapper .header > a.header-link { width: 2.25rem; padding: 0; gap: 0; justify-content: center; font-size: 0; }
  html[data-kdl-sk-hlabels="auto"] .content-wrapper .header > a.header-link::before { width: 1.125rem; height: 1.125rem; }
  html[data-kdl-sk-hlabels="auto"] .content-wrapper .header > a.header-link:first-of-type { margin-left: 4px; }
}
/* Centred links: the menu button pushes from the left, a spacer of its width balances it on the right */
html[data-kdl-sk-halign="center"] .content-wrapper .header #burgor { margin-right: auto; }
html[data-kdl-sk-halign="center"] .content-wrapper .header::after { content: ''; flex: 0 0 2.25rem; margin-left: auto; }
html[data-kdl-sk-halign="center"] .content-wrapper .header-link:first-of-type { margin-left: 0; }
/* Pinned top bar */
/* Only while the bar is shown: with the sidebar open on wide screens the site hides it with a negative margin,
   which a sticky bar would undo as soon as the page scrolls */
@media (max-width: 1020px) {
  html[data-kdl-sk-pin="true"] .content-wrapper .header { position: sticky; top: 0; z-index: 5; }
}
@media (min-width: 1021px) {
  html[data-kdl-sk-pin="true"] .content-wrapper .header.sidebar-retracted,
  html[data-kdl-sk-pin="true"][data-kdl-sk-sidebar="overlay"] .content-wrapper .header { position: sticky; top: 0; z-index: 5; }
}
/* Overlay sidebar (wide screens): the page keeps its full width and the top bar stays, the open sidebar
   floats over the page and dims it (a click outside closes it, see index.ts) */
@media (min-width: 1021px) {
  html[data-kdl-sk-sidebar="overlay"] .content-wrapper.shifted { margin-left: 0; }
  html[data-kdl-sk-sidebar="overlay"] .content-wrapper .header { margin-top: 0; }
  html[data-kdl-sk-sidebar="overlay"] .global-sidebar { top: 0; z-index: 30; }
  html[data-kdl-sk-sidebar="overlay"] .global-sidebar:not(.retracted) {
    box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.45), 0 10px 40px rgb(0 0 0 / 0.5);
  }
}
.content-wrapper .backdrop { background: var(--kdl-overlay); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }

/* Content */
/* The wrapper is a flex item: without min-width 0 its widest row (the top bar's labelled links, a strip of cards)
   sets the page width and pushes everything past the right edge */
.content-wrapper { min-width: 0; }
.content-wrapper > .main { padding: 24px 32px; }
@media (max-width: 1020px) {
  .content-wrapper > .main { padding: 16px 10px; }
}
.site-section__header { margin-bottom: 8px; }
.site-section__heading { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; }
.site-section__subheading { font-size: 1.125rem; font-weight: 600; letter-spacing: -0.02em; }
@media (max-width: 600px) {
  h1${NK}, .site-section__heading { font-size: 1.5rem; }
}
.no-posts, .no-results, .card-list__item--no-results { color: var(--kdl-muted-foreground); }

/* Surface panels (transparent at flat contrast): pagination bars */
.paginator:has(> menu):not(:has(.card-list)) {
  padding: 6px 8px 6px calc(var(--kdl-panel-pad) * 0.75);
  border: 1px solid var(--kdl-panel-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-panel-bg);
}

/* Footer */
.content-wrapper > .global-footer {
  margin-top: 24px;
  padding: 16px 12px 24px;
  border-top: 1px solid var(--kdl-border);
  color: var(--kdl-muted-foreground);
  font-size: 13px;
  text-align: center;
}
.global-footer .footer { margin: 0; padding: 0; }
.global-footer .footer li { color: var(--kdl-muted-foreground); }
.global-footer .footer li a {
  --local-colour1-primary: var(--kdl-muted-foreground);
  --local-colour1-secondary: var(--kdl-muted-foreground);
}
.global-footer .footer li a:hover { color: var(--kdl-foreground); }
/* Footer links as small outline buttons (label without the brackets, see pages.ts) */
.global-footer .footer li { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; font-size: 0; }
.global-footer .footer a[data-kdl-label] {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.875rem;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: color-mix(in srgb, var(--kdl-card) 80%, transparent);
  color: var(--kdl-foreground);
  font-size: 0;
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.global-footer .footer a[data-kdl-label]::after { content: attr(data-kdl-label); font-size: 13px; font-weight: 500; }
.global-footer .footer a[data-kdl-label]:hover { background: var(--kdl-accent); border-color: var(--kdl-ring); }
.global-footer .footer a[data-kdl-label]:focus-visible { outline: 2px solid var(--kdl-ring); outline-offset: 2px; }
/* The API page: Swagger's frame sized to its content (pages.ts) */
iframe[data-kdl-sk="api"] { display: block; width: 100%; border: 1px solid var(--kdl-border) !important; border-radius: var(--kdl-radius); background: var(--kdl-card) !important; }
`;
