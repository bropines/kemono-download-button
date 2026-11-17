// Built-in presets. Plain themes: their CSS is scoped like user CSS (selectors are prefixed
// with html[data-kdl-site][data-kdl-page…]), so write site selectors as they are.
// Selectors come from the Pawchive/Kemono markup: .global-sidebar, .content-wrapper > .header,
// #main > .site-section, .card-list__items > article.post-card, .user-header, ul.tabs,
// .post__header/.post__body/.post__content, footer.post__footer > .post__comments.

import type { Theme } from './types';

const preset = (theme: Omit<Theme, 'enabled' | 'origin' | 'vars' | 'transforms'> & Partial<Theme>): Theme => ({
  vars: {},
  transforms: [],
  ...theme,
  enabled: false,
  origin: 'builtin',
});

const LIST_PAGES: Theme['pages'] = ['list', 'creator', 'search', 'artists'];

export const BUILTIN_THEMES: Theme[] = [
  preset({
    id: 'builtin-dense-grid',
    name: 'Dense grid',
    description: 'Cards at 80% of the grid size, 4px gaps, slimmer captions clamped to two lines.',
    sites: 'any',
    pages: LIST_PAGES,
    css: `
.card-list { padding: 0.25em 0; }
.card-list__items { gap: 4px !important; }
.card-list__items > * { flex-basis: calc(var(--card-size, 180px) * 0.8) !important; }
.post-card {
  width: calc(var(--card-size, 180px) * 0.8) !important;
  height: calc(var(--card-size, 180px) * 0.8) !important;
  font-size: 70%;
}
.post-card__header, .post-card__footer { padding: 2px 4px; }
.post-card__header {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-card__footer > div > img { height: 14px; }
.post-card:hover > a { top: 0; }
.paginator { margin: 0.25em 0; }
`,
  }),
  preset({
    id: 'builtin-clutter-off',
    name: 'Clutter off',
    description: 'Hides announcements, the footer, DM links/tabs, community and promo boxes; the sidebar collapses to an icon rail that opens on hover.',
    sites: 'any',
    pages: 'any',
    transforms: [
      { selector: '.global-footer, .ad-container, .jumbo-welcome, .announcement, .announcements, #announcements, .announcement-banner', action: 'hide' },
      { selector: '.global-sidebar-entry.stuck-bottom, .tooltip__message--register', action: 'hide' },
      { selector: 'a.global-sidebar-entry-item[href="/dms"], a.global-sidebar-entry-item[href$="/review_dms"], .tabs .tab:has(> a[href$="/dms"])', action: 'hide' },
      { selector: '.header-link.register, .header-link.login, .global-sidebar-entry-item.register', action: 'hide' },
    ],
    css: `
@media (min-width: 1021px) {
  .global-sidebar:not(.retracted) {
    width: 3.25rem;
    min-width: 0;
    overflow-x: hidden;
    z-index: 10;
    transition: width 0.2s ease, box-shadow 0.2s ease;
  }
  .global-sidebar:not(.retracted):hover,
  .global-sidebar:not(.retracted):focus-within {
    width: 12rem;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  }
  .content-wrapper.shifted { margin-left: 3.25rem; }
  .global-sidebar-entry { margin-left: 0.5rem; margin-right: 0.5rem; }
  .global-sidebar-entry-item:not(.header):not(.clickable-header) { padding-left: 0.5rem; }
  .global-sidebar:not(:hover):not(:focus-within) .close-sidebar { display: none; }
  .global-sidebar:not(:hover):not(:focus-within) .global-sidebar-entry-item.header { color: transparent; }
}
`,
  }),
  preset({
    id: 'builtin-compact-header',
    name: 'Compact sticky header',
    description: 'A thin translucent top bar that stays on screen while scrolling.',
    sites: 'any',
    pages: 'any',
    transforms: [{ selector: '.content-wrapper > .header', action: 'sticky', arg: '0' }],
    css: `
.content-wrapper > .header {
  height: 2rem;
  font-size: 13px;
  background: color-mix(in srgb, var(--colour1-secondary, #282a2e) 82%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
}
.content-wrapper > .header #burgor { min-width: 36px; padding: 4px; }
.content-wrapper > .header .header-link { padding: 4px 8px; }
`,
  }),
  preset({
    id: 'builtin-reader',
    name: 'Reader mode',
    description: 'Posts in a centred column with larger type, no banners or borders; comments collapse to a short preview (click the heading to expand).',
    sites: 'any',
    pages: ['post'],
    transforms: [
      { selector: 'footer.post__footer > .site-section__subheading', action: 'setAttr', arg: 'tabindex=0' },
      { selector: 'footer.post__footer > .post__comments', action: 'setAttr', arg: 'tabindex=-1' },
      { selector: '.ad-container, .post__user .fancy-image--background', action: 'hide' },
    ],
    css: `
#main > .site-section--post { max-width: 760px; margin-inline: auto; }
.post__header { border: none; border-radius: 0; background: none; }
.post__title { font-size: 1.9em; line-height: 1.25; }
.post__body { border: none; padding: 1em 0; }
.post__content { font-size: 1.15rem; line-height: 1.75; }
.post__content img, .post__files img { max-width: 100%; height: auto; }
.post__nav-links { opacity: 0.6; }
footer.post__footer > .site-section__subheading { cursor: pointer; }
footer.post__footer > .site-section__subheading::after { content: ' \\25BE'; opacity: 0.6; }
footer.post__footer:not(:focus-within) > .post__comments {
  max-height: 9em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
}
footer.post__footer > .post__comments:focus { outline: none; }
`,
  }),
  preset({
    id: 'builtin-compact-creator',
    name: 'Compact creator header',
    description: 'Creator banner hidden, a slim header row with a small avatar, page tabs as pills.',
    sites: 'any',
    pages: ['creator'],
    css: `
.user-header {
  max-width: none;
  background-color: var(--colour1-secondary, #2a2d31);
  border-radius: 10px;
}
.user-header__background { display: none; }
.user-header__avatar { flex: 0 0 3.5em; height: 3.5em; margin: 0.5em; border-radius: 50%; overflow: hidden; }
.user-header__info { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.5em 1em; text-shadow: none; }
.user-header__name { margin: 0; font-size: 1.25em; }
.user-header__actions { font-size: 1em; text-shadow: none; }
ul.tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0.5em 0; }
ul.tabs .tab { height: auto; line-height: 1.6; padding: 0; }
ul.tabs .tab a {
  padding: 0.2em 0.9em;
  border-radius: 999px;
  border-bottom: none;
  background: var(--colour1-secondary, #2a2d31);
}
ul.tabs .tab a.active { background: var(--anchour-colour1-primary, #99ddff); color: #000; }
`,
  }),
  preset({
    id: 'builtin-dim-viewed',
    name: 'Dim viewed posts',
    description: 'Posts you already opened turn grey and faint, get a "Viewed" tag and light up on hover.',
    sites: 'any',
    pages: LIST_PAGES,
    css: `
.post-card.kui-viewed { opacity: 0.3; filter: grayscale(1); transition: opacity 0.15s ease, filter 0.15s ease; }
.post-card.kui-viewed:hover, .post-card.kui-viewed:focus-within { opacity: 1; filter: none; }
.post-card.kui-viewed .post-card__header::before {
  content: 'Viewed';
  display: inline-block;
  margin-right: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.85);
  color: #000;
  font-size: 85%;
  text-shadow: none;
}
`,
  }),
];
