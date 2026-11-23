// Text pages (importer notes, FAQ, contact), account pages and key cards, announcements, and the home
// page over its own background art. Wrappers named kdl-sk-* come from ../pages.ts.

import { NK } from './base';

const PANEL = `
  padding: 20px 24px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  color: var(--kdl-card-foreground);
  box-shadow: var(--kdl-shadow-sm);
  box-sizing: border-box;
`;
const BADGE = `
  display: inline-flex;
  align-items: center;
  height: 1.375rem;
  padding: 0 0.55rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
`;
// Pages that are short by nature: their footer rests on the bottom edge
const SHORT_PAGE = `.content-wrapper:has(:is(.site-section--login, .site-section--register, .site-section--contact, .site-section--file-hash-search, .site-section--importer, .site-section--faq, .site-section--account, #page.page:not(:has(.card-list))))`;
const READABLE = 'max-width: 48rem; margin-left: auto; margin-right: auto;';

// Account page menu icons (Lucide), matched by link address
const accSvg = (paths: string): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${paths}</svg>`)}")`;
const ACCOUNT_LINK = accSvg("<path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/><path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/>");
const ACCOUNT_CHEVRON = accSvg("<path d='m9 18 6-6-6-6'/>");
const ACCOUNT_ICON_LIST: [string, string][] = [
  ['notifications', accSvg("<path d='M10.268 21a2 2 0 0 0 3.464 0'/><path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'/>")],
  ['keys', accSvg("<path d='m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4'/><path d='m21 2-9.6 9.6'/><circle cx='7.5' cy='15.5' r='5.5'/>")],
  ['dms', accSvg("<rect width='20' height='16' x='2' y='4' rx='2'/><path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'/>")],
  ['block', accSvg("<circle cx='12' cy='12' r='10'/><path d='m4.9 4.9 14.2 14.2'/>")],
  ['settings', accSvg("<path d='M20 7h-9'/><path d='M14 17H5'/><circle cx='17' cy='17' r='3'/><circle cx='7' cy='7' r='3'/>")],
  ['password', accSvg("<rect width='18' height='11' x='3' y='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/>")],
  ['favorites', accSvg("<path d='M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'/>")],
  ['administrator', accSvg("<path d='M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'/>")],
];
const ACCOUNT_ICONS = ACCOUNT_ICON_LIST.map(([part, icon]) => `.site-section--account .account-view :is(ul, ol) > li:has(> a[href*="${part}"]) { --kdl-acc-icon: ${icon}; }`).join('\n');

export const pagesCss = (): string => `
/* Panels */
.kdl-sk-panel { ${PANEL} ${READABLE} margin-top: 16px; margin-bottom: 16px; }
.kdl-sk-panel > :first-child { margin-top: 0; }
.kdl-sk-panel > :last-child { margin-bottom: 0; }
.kdl-sk-panel > :is(h2, h3, h4) { margin: 0 0 8px; font-size: 1.0625rem; font-weight: 600; letter-spacing: -0.015em; }
.kdl-sk-panel p${NK} { margin: 0 0 10px; color: color-mix(in srgb, var(--kdl-foreground) 85%, transparent); line-height: 1.7; }
.site-section--importer > .site-section__heading { ${READABLE} text-align: center; }
.site-section--importer > .kdl-sk-panel { max-width: 40rem; }

/* Long-form pages (FAQ / tutorial, contact) */
:is(#page.page:not(:has(.card-list)), .site-section--faq) { ${READABLE} line-height: 1.7; }
:is(#page.page:not(:has(.card-list)), .site-section--faq) > h1 { margin: 8px 0 16px; text-align: center; }
:is(#page.page:not(:has(.card-list)), .site-section--faq) > h2 {
  margin: 28px 0 10px;
  color: var(--kdl-muted-foreground);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
:is(#page.page:not(:has(.card-list)), .site-section--faq) :is(ul, ol)${NK} { padding-left: 1.25rem; }
:is(#page.page:not(:has(.card-list)), .site-section--faq) li${NK} { margin: 4px 0; }
:is(#page.page:not(:has(.card-list)), .site-section--faq) img${NK} {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
}
:is(#page.page:not(:has(.card-list)), .site-section--faq) code${NK} { overflow-wrap: anywhere; }
.kdl-sk-filtered { display: none; }

/* FAQ toolbar and accordion */
.kdl-scope.kdl-sk-faq-tools {
  position: sticky;
  top: 8px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding: 8px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: color-mix(in srgb, var(--kdl-card) 88%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.kdl-sk-faq-tools .kdl-sk-faq-search { flex: 1 1 14rem; min-width: 0; }
.kdl-sk-faq-tools .kdl-sk-faq-empty { flex: 1 0 100%; margin: 4px; color: var(--kdl-muted-foreground); font-size: 13px; }
.kdl-sk-faq-tools .kdl-sk-faq-empty[hidden] { display: none; }
.kdl-sk-acc {
  margin: 0 0 8px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: var(--kdl-card);
  transition: border-color 0.15s ease;
}
.kdl-sk-acc[hidden] { display: none; }
.kdl-sk-acc[open] { border-color: var(--kdl-hover-ring); }
.kdl-sk-acc__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--kdl-radius);
  list-style: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.kdl-sk-acc__summary::-webkit-details-marker { display: none; }
.kdl-sk-acc__summary::after {
  content: '';
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-left: auto;
  background: var(--kdl-chevron) no-repeat center / 1rem;
  transition: transform 0.2s ease;
}
.kdl-sk-acc[open] > .kdl-sk-acc__summary::after { transform: rotate(180deg); }
.kdl-sk-acc__summary:hover { background: var(--kdl-accent); }
.kdl-sk-acc__summary:focus-visible { outline: none; box-shadow: var(--kdl-focus-ring); }
.kdl-sk-acc__summary > :is(h2, h3, h4) { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: -0.01em; }
.kdl-sk-acc__body { padding: 4px 16px 14px; border-top: 1px solid var(--kdl-border); }
.kdl-sk-acc__body > :first-child { margin-top: 8px; }
.kdl-sk-acc__body > :last-child { margin-bottom: 0; }

.site-section--contact > div[style] { ${PANEL} max-width: 48rem; margin-top: 8px; }

/* Account pages */
.site-section--account .account-view { ${PANEL} max-width: 32rem; margin: 16px auto; padding: 24px; text-align: left; }
.site-section--account .account-view > :is(h1, h2, header, .account-view__header):first-child { margin: 0; text-align: center; }
.site-section--account .account-view__greeting { color: var(--kdl-muted-foreground); font-size: 1.5rem; font-weight: 400; }
.site-section--account .account-view__identity { color: var(--kdl-foreground); font-weight: 600; }
.site-section--account .account-view__info { margin: 6px 0 0; color: var(--kdl-muted-foreground); font-size: 13px; text-align: center; }
.site-section--account .account-view__info a { color: var(--kdl-foreground); }
/* The links under the greeting: a menu, one row per link, with its icon and a chevron */
.site-section--account .account-view :is(ul, ol) {
  display: flex; flex-direction: column; gap: 2px; margin: 20px 0 0; padding: 6px;
  border: 1px solid var(--kdl-border); border-radius: calc(var(--kdl-radius) + 2px); background: var(--kdl-background);
  list-style: none;
}
.site-section--account .account-view :is(ul, ol) > li {
  position: relative; display: flex; align-items: center; gap: 6px; min-height: 40px; margin: 0; padding: 0 12px;
  border-radius: calc(var(--kdl-radius) - 2px); color: var(--kdl-muted-foreground); font-size: 14px;
  transition: background-color 0.15s ease;
}
.site-section--account .account-view :is(ul, ol) > li:hover { background: var(--kdl-accent); }
.site-section--account .account-view :is(ul, ol) > li > a { color: var(--kdl-foreground); text-decoration: none; }
/* The whole row opens the link */
.site-section--account .account-view :is(ul, ol) > li > a:first-of-type::after { content: ""; position: absolute; inset: 0; }
.site-section--account .account-view :is(ul, ol) > li::before {
  content: ""; flex: none; width: 16px; height: 16px; margin-right: 4px; background: var(--kdl-foreground); opacity: 0.7;
  -webkit-mask: var(--kdl-acc-icon, ${ACCOUNT_LINK}) center / contain no-repeat; mask: var(--kdl-acc-icon, ${ACCOUNT_LINK}) center / contain no-repeat;
.site-section--account .account-view :is(ul, ol) > li::after {
  content: ""; flex: none; width: 14px; height: 14px; margin-left: auto; background: currentColor; opacity: 0.5;
  -webkit-mask: ${ACCOUNT_CHEVRON} center / contain no-repeat; mask: ${ACCOUNT_CHEVRON} center / contain no-repeat;
}
${ACCOUNT_ICONS}
.site-section--account-notifications .notifications__list { display: flex; flex-direction: column; gap: 8px; max-width: 48rem; margin: 0 auto; }
.site-section--account-notifications .notifications__list > li { ${PANEL} padding: 12px 16px; }
.site-section--account-notifications .notifications__item--seen { opacity: 0.6; }

/* Stored service keys: each key a card with a status badge, mono log ids and an outline Revoke toggle */
.site-section--account-keys .card-list__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
  gap: 12px;
}
.site-section--account-keys .key__view {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  box-shadow: var(--kdl-shadow-sm);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.site-section--account-keys .key__view:hover { border-color: var(--kdl-hover-ring); }
.site-section--account-keys .key__view:has(.key__revoke-check:checked) {
  border-color: color-mix(in srgb, var(--kdl-destructive) 70%, var(--kdl-border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--kdl-destructive) 50%, transparent);
}
.site-section--account-keys .key__view:has(.key__revoke-check:focus-visible) { box-shadow: var(--kdl-focus-ring); }
.site-section--account-keys .key__info { flex: 1 1 auto; max-width: none; height: auto; border: 0; border-radius: 0; background: transparent; }
.site-section--account-keys .key__card { display: flex; flex-direction: column; gap: 0; height: auto; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.site-section--account-keys .key__card:is(:hover, :focus-within) { box-shadow: none; }
.site-section--account-keys .key__card > * { align-self: stretch; padding: 0 16px; text-align: left; }
.site-section--account-keys .key__card .card__header { padding-top: 14px; padding-bottom: 6px; color: var(--kdl-foreground); font-size: 15px; font-weight: 600; }
.site-section--account-keys .key__card .card__body { display: flex; flex-direction: column; gap: 6px; padding-bottom: 8px; font-size: 13px; }
.site-section--account-keys .key__card .card__footer { padding-bottom: 12px; color: var(--kdl-muted-foreground); font-size: 12px; }
.service-key__stat { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; color: var(--kdl-muted-foreground); }
.service-key__stat > * { display: inline; }
.service-key__stat :is(ul, ol) { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; list-style: none; }
.service-key__stat a${NK} {
  display: inline-block;
  padding: 0.05rem 0.4rem;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) - 4px);
  background: var(--kdl-muted);
  color: var(--kdl-foreground);
  font-family: var(--kdl-font-mono);
  font-size: 11.5px;
  overflow-wrap: anywhere;
}
.service-key__stat a${NK}:hover { border-color: var(--kdl-hover-ring); }
.service-key__status {
  ${BADGE}
  border-color: color-mix(in srgb, var(--kdl-success) 40%, transparent);
  background: color-mix(in srgb, var(--kdl-success) 15%, transparent);
  color: var(--kdl-success);
}
.service-key__status--dead {
  border-color: color-mix(in srgb, var(--kdl-destructive) 45%, transparent);
  background: color-mix(in srgb, var(--kdl-destructive) 15%, transparent);
  color: color-mix(in srgb, var(--kdl-destructive) 70%, var(--kdl-foreground));
}
.site-section--account-keys .key__label {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  height: 2.25rem;
  margin: 0 16px 14px;
  padding: 0 1rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--kdl-background);
  color: var(--kdl-foreground);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.site-section--account-keys .key__label:hover {
  border-color: color-mix(in srgb, var(--kdl-destructive) 60%, var(--kdl-input));
  background: color-mix(in srgb, var(--kdl-destructive) 12%, var(--kdl-background));
}
.site-section--account-keys .key__revoke-check:checked ~ .key__label {
  border-color: var(--kdl-destructive);
  background: var(--kdl-destructive);
  color: var(--kdl-destructive-foreground);
}
#revoke-service-keys { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 64rem; margin: 0 auto; padding: 0; }
#revoke-service-keys .form__button--submit {
  align-self: center;
  width: auto;
  border-color: var(--kdl-destructive);
  background: var(--kdl-destructive);
  color: var(--kdl-destructive-foreground);
}
#revoke-service-keys .form__button--submit:hover { background: color-mix(in srgb, var(--kdl-destructive) 88%, var(--kdl-foreground)); }

/* Announcements */
.jumbo-announcement, .announcement { ${PANEL} margin: 0 0 12px; padding: 14px 18px; }
.jumbo-announcement :is(h2, h3) { font-size: 1rem; }
.announcement-title-container .date { font-size: 12px; }

/* Contact page: the mail addresses as buttons */
.site-section--contact a[href^="mailto:"] {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  margin: 2px 0;
  padding: 0 0.75rem;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--kdl-secondary);
  color: var(--kdl-secondary-foreground);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  vertical-align: middle;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.site-section--contact a[href^="mailto:"]:hover { background: var(--kdl-accent); border-color: var(--kdl-ring); }

/* Home: the welcome art fills the page as is; only the sidebar and the text card blur what is behind them */
.site-section--home .jumbo-welcome {
  position: static;
  min-height: calc(100vh - 12rem);
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  overflow: visible;
  background: transparent;
  box-shadow: none;
}
.site-section--home .jumbo-welcome-background {
  position: fixed;
  /* Sized to the large viewport: on phones the address bar showing/hiding would otherwise rescale the art */
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  height: var(--kdl-home-art-h, 100lvh);
  z-index: -1;
  width: auto;
  height: auto;
  background-size: cover;
  background-position: center;
  pointer-events: none;
}
.site-section--home .jumbo-welcome-description {
  position: relative;
  width: min(40rem, 100%);
  height: auto;
  padding: 28px 32px;
  border: 1px solid color-mix(in srgb, var(--kdl-border) 80%, transparent);
  border-radius: calc(var(--kdl-radius) + 8px);
  background: color-mix(in srgb, var(--kdl-card) 72%, transparent);
  box-shadow: var(--kdl-shadow);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
  line-height: 1.7;
}
.site-section--home .jumbo-welcome-description ul${NK} { padding-left: 1.25rem; }
.site-section--home .jumbo-welcome-credits { float: none; margin-top: 12px; color: var(--kdl-muted-foreground); font-size: 12px; }
body:has(.site-section--home) { background-color: var(--kdl-background); }
/* Home footer: no rule line over the art */
body:has(.site-section--home) .global-footer { border: 0; background: transparent; box-shadow: none; }
body:has(.site-section--home) .global-sidebar {
  background: color-mix(in srgb, var(--kdl-sidebar) 70%, transparent);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
/* File hash search: a card with a drop zone for the file, an "or" divider and the hash field */
.site-section--file-hash-search { max-width: 560px; margin-inline: auto; }
#file-search {
  display: grid;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--kdl-panel-border, var(--kdl-border));
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-panel-bg, var(--kdl-card));
  text-align: left;
}
#file-search > label { color: var(--kdl-foreground); font-size: 14px; font-weight: 600; }
/* Our drop zone with the real file input stretched invisibly over it (pages.ts) */
#file-search .kdl-sk-drop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 8.5rem;
  padding: 1.25rem 1rem;
  border: 1.5px dashed var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: color-mix(in srgb, var(--kdl-muted) 55%, transparent);
  color: var(--kdl-muted-foreground);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
#file-search .kdl-sk-drop:is(:hover, :focus-within, [data-drag]) { border-color: var(--kdl-ring); background: var(--kdl-accent); }
#file-search .kdl-sk-drop[data-has-file] { border-style: solid; border-color: color-mix(in srgb, var(--kdl-primary) 60%, var(--kdl-border)); }
#file-search .kdl-sk-drop > input[type="file"] { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; opacity: 0; cursor: pointer; }
.kdl-sk-drop__icon {
  width: 1.75rem;
  height: 1.75rem;
  margin-bottom: 4px;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpath d='M17 8l-5-5-5 5'/%3E%3Cpath d='M12 3v12'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpath d='M17 8l-5-5-5 5'/%3E%3Cpath d='M12 3v12'/%3E%3C/svg%3E") center / contain no-repeat;
}
.kdl-sk-drop__title { color: var(--kdl-foreground); font-size: 14px; font-weight: 500; }
.kdl-sk-drop__hint { font-size: 12px; }
.kdl-sk-drop__file:empty { display: none; }
.kdl-sk-drop__file {
  max-width: 100%;
  margin-top: 6px;
  padding: 2px 10px;
  border-radius: 9999px;
  background: var(--kdl-secondary);
  color: var(--kdl-secondary-foreground);
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#file-search .kdl-sk-drop[data-has-file] .kdl-sk-drop__hint { display: none; }
#file-search > span { display: flex; align-items: center; gap: 0; margin: 2px 0; color: var(--kdl-muted-foreground); font-size: 0; user-select: none; }
#file-search > span > br { display: none; }
#file-search > span::before, #file-search > span::after { content: ''; flex: 1 1 auto; height: 1px; background: var(--kdl-border); }
#file-search > span > .kdl-sk-or__label { padding: 0 12px; font-size: 12px; font-style: normal; text-transform: uppercase; letter-spacing: 0.08em; }
#file-search input[type="text"] { width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
#file-search input[type="submit"] { width: 100%; margin-top: 6px; }
/* The footer rests on the bottom edge of short pages: its place no longer depends on how tall the content (or the
   skeleton standing in for it) is, so it does not jump when a page is shown */
${SHORT_PAGE} { display: flex; flex-direction: column; }
${SHORT_PAGE} > * { flex-shrink: 0; }
${SHORT_PAGE} > footer.global-footer { margin-top: auto; }
/* While the page waits behind its skeleton (whose height is a guess) the footer is not drawn: showing it would
   move it once the real content replaces the skeleton */
html[data-kdl-cloak] .content-wrapper > .global-footer { visibility: hidden; }
/* The API page: Swagger's frame starts past the fold, so growing into its content moves nothing in view */
iframe[src*="swagger"] { height: max(850px, 100vh); min-height: 200px; }
/* Hash search and the keyed pages: the heading sits closer to its card on phones */
.site-section--file-hash-search > .site-section__header { margin-bottom: 4px; }
.site-section--contact > div[style] > a[href^="mailto:"] { margin-left: 4px; }
.site-section--contact > div[style] { line-height: 1.7; }
/* Creators list (Pawchive): its script fills the empty top paginator while "Loading creators..." shows. The loading
   line is drawn as the paginator's empty frame (same box: one 46px row; two, 72px, on phones) with a muted label, so
   the paginator simply appears in it and the cards do not move */
.site-section--artists.is-loading > #loading {
  box-sizing: border-box; width: 100%; max-width: 768px; min-height: 46px; margin: 12px auto;
  display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 12px;
  border: 1px solid var(--kdl-panel-border); border-radius: calc(var(--kdl-radius) + 4px); background: var(--kdl-panel-bg);
  color: var(--kdl-muted-foreground); font-size: 12px;
}
.site-section--artists.is-loading > #loading > .subtitle { margin: 0; color: inherit; font-size: inherit; font-weight: 400; }
.site-section--artists.is-loading > #loading > .loading__spinner { width: 12px; height: 12px; opacity: 0.6; }
/* The site draws the cards a second time once the list arrives, adding a "N favorites" (or "updated") line: the
   first cards keep an empty line of that size, so every card does not grow by a row then */
/* Sorted other than by popularity (Recent: Date Updated), or filtered, the cards the server sends are not the ones the
   site's script then puts there (it lists imported creators first): until it has, they are blank placeholders of the
   same size instead of a list that is about to be replaced */
.site-section--artists.is-loading:is(:has(#sort_by option:checked:not([value="favorited"], [value=""])), :has(#service option:checked:not([value=""])), :has(input[name="q"][value]:not([value=""]))) .card-list__items > .user-card {
  background: var(--kdl-muted) !important; border-color: var(--kdl-border); box-shadow: none; animation: kdl-artists-wait 1.4s ease-in-out infinite;
}
.site-section--artists.is-loading:is(:has(#sort_by option:checked:not([value="favorited"], [value=""])), :has(#service option:checked:not([value=""])), :has(input[name="q"][value]:not([value=""]))) .card-list__items > .user-card > * { visibility: hidden; }
@keyframes kdl-artists-wait { 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) { .site-section--artists.is-loading .card-list__items > .user-card { animation: none !important; } }
.site-section--artists .user-card__info:not(:has(> .user-card__count, > .user-card__updated))::after { content: '\\a0'; font-size: 12px; }
@media (max-width: 600px) { .site-section--artists.is-loading > #loading { min-height: 72px; } }
@media (max-width: 600px) {
  .kdl-sk-panel, .site-section--home .jumbo-welcome-description { padding: 16px; }
  .site-section--file-hash-search #file-search { padding: 16px; }
  .site-section--home .jumbo-welcome { min-height: calc(100vh - 9rem); }
  .kdl-sk-faq-tools .kdl-sk-faq-search { flex-basis: 100%; }
  .kdl-sk-faq-tools > .kdl-ui-btn { flex: 1 1 0; }
}
`;
