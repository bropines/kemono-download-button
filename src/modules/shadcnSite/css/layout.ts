// Sidebar, top header, content padding, page headings and the footer.
// Widths and the header height stay the site's: its own media queries slide them in and out.

import { NK } from './base';

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
.content-wrapper .backdrop { background: var(--kdl-overlay); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }

/* Content */
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
  padding: calc(var(--kdl-panel-pad) * 0.75) var(--kdl-panel-pad);
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
