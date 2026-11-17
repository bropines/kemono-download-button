// Typography, links, form controls, buttons, pagination, tabs, tooltip and scrollbars.
// NK keeps generic element rules off the script's own kit widgets and third-party markup (Plyr).

export const NK = ':where(:not(.kdl-scope, .kdl-scope *, .kdl-tokens, .kdl-tokens *))';

const TEXT_INPUTS =
  'input[type=text], input[type=search], input[type=password], input[type=email], input[type=number], input[type=url], textarea, select';
const inputs = (suffix = '') =>
  TEXT_INPUTS.split(', ')
    .map((s) => `${s}${NK}${suffix}`)
    .join(', ');

// Site controls that become kit-style buttons (outline variant)
const BUTTONS = '.button, .form__button, .order-toggle, .tooltip__close, .dev-form__submit';
const PRIMARY = `.button--primary, .form__button--submit, input[type=submit]${NK}`;

export const baseCss = (): string => `
body {
  font-family: var(--kdl-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--kdl-foreground);
  background-color: var(--kdl-background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
::selection { background: color-mix(in srgb, var(--kdl-primary) 25%, transparent); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--kdl-muted-foreground) 30%, transparent);
  border: 2px solid transparent;
  border-radius: 9999px;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, var(--kdl-muted-foreground) 50%, transparent); }

:is(h1, h2, h3, h4, h5, h6)${NK} {
  text-transform: none;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--kdl-foreground);
}
h1${NK} { font-size: 1.875rem; line-height: 1.2; }
h2${NK} { font-size: 1.25rem; line-height: 1.4; }
h3${NK} { font-size: 1.125rem; line-height: 1.4; }
:is(h4, h5, h6)${NK} { font-size: 1rem; line-height: 1.5; }
:is(button, input, select, textarea)${NK} { font-family: inherit; }

hr${NK} { border: 0; border-top: 1px solid var(--kdl-border); }
code${NK}, kbd${NK} {
  padding: 0.1em 0.35em;
  border-radius: calc(var(--kdl-radius) - 4px);
  background: var(--kdl-muted);
  font-size: 0.875em;
}

a${NK} {
  border-bottom: 0;
  text-underline-offset: 4px;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
a${NK}:focus { background-color: transparent; }
a${NK}:focus-visible {
  outline: 2px solid var(--kdl-ring);
  outline-offset: 2px;
  border-radius: calc(var(--kdl-radius) - 4px);
}
.fancy-link--button:is(:focus, :hover) { background-color: var(--kdl-accent); }
.timestamp { color: var(--kdl-muted-foreground); }
.subtitle, .form__subtitle { color: var(--kdl-muted-foreground); }

/* Inputs, selects, textareas */
${inputs()} {
  min-height: 2.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  background-color: transparent;
  color: var(--kdl-foreground);
  font-size: 14px;
  line-height: 1.4;
  box-shadow: var(--kdl-shadow-sm);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
${inputs(':hover')} { border-color: var(--kdl-hover-ring); }
${inputs(':focus')} {
  outline: none;
  border-color: var(--kdl-ring);
  background-color: transparent;
  box-shadow: var(--kdl-focus-ring);
}
${inputs('::placeholder')} { color: var(--kdl-muted-foreground); }
select${NK} {
  padding-right: 2rem;
  background-image: var(--kdl-chevron);
  background-position: right 0.6rem center;
  background-size: 1rem;
}
select${NK} option { color: var(--kdl-popover-foreground); background-color: var(--kdl-popover); }
input.search-input${NK} {
  height: 2.25rem;
  max-width: 28rem;
  padding-left: 2.25rem;
  background-position: left 0.75rem center;
  background-size: 15px;
}
.search-bar { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; margin: 12px 0; }
.search-form {
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
  box-shadow: var(--kdl-shadow-sm);
}
.search-form__controls { gap: 8px; }

/* Buttons */
${BUTTONS}, input[type=submit]${NK} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: 2.25rem;
  padding: 0 1rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  background-color: var(--kdl-background);
  color: var(--kdl-foreground);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  text-shadow: none;
  white-space: nowrap;
  box-shadow: var(--kdl-shadow-sm);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
:is(${BUTTONS}):not(.order-toggle), input[type=submit]${NK} { background-image: none; }
:is(${BUTTONS}):hover { background-color: var(--kdl-accent); border-color: var(--kdl-input); color: var(--kdl-accent-foreground); }
:is(${BUTTONS}, ${PRIMARY}):active { transform: none; }
:is(${BUTTONS}, ${PRIMARY}):focus-visible { outline: none; box-shadow: var(--kdl-focus-ring); }
:is(${BUTTONS}, ${PRIMARY}):is(:disabled, [disabled]) { opacity: 0.5; cursor: not-allowed; }
${PRIMARY} {
  border-color: var(--kdl-primary);
  background-color: var(--kdl-primary);
  background-image: none;
  color: var(--kdl-primary-foreground);
}
:is(${PRIMARY}):hover {
  border-color: transparent;
  background-color: color-mix(in srgb, var(--kdl-primary) 90%, transparent);
  color: var(--kdl-primary-foreground);
}
/* The sort toggle keeps the site's arrow image */
.order-toggle {
  width: 2.25rem;
  padding: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 1rem;
}
.order-toggle[value=desc], .order-toggle[value=asc] { background-color: var(--kdl-background); }
.order-toggle:hover { background-color: var(--kdl-accent); }
.tooltip__close { min-height: 1.75rem; padding: 0 0.6rem; font-size: 12px; box-shadow: none; }

/* Pagination */
/* stretch, not center: the popular page nests the card list inside a paginator */
.paginator { display: flex; flex-direction: column; align-items: stretch; gap: 8px; margin: 12px 0; }
.paginator > small { color: var(--kdl-muted-foreground); font-size: 12px; text-align: center; }
.paginator > form { display: flex; justify-content: center; width: 100%; }
.paginator menu { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin: 0; padding: 0; }
.paginator menu > li, .paginator menu > a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: calc(var(--kdl-radius) - 2px);
  background: transparent;
  color: var(--kdl-foreground);
  font-size: 14px;
  line-height: 1;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.paginator menu > li > b, .paginator menu > a > b { padding: 0 0.5rem; font-weight: 500; }
.paginator menu > li.pagination-button-after-current, .paginator menu > a.pagination-button-after-current { border-left-color: transparent; }
.paginator menu > li.pagination-button-disabled, .paginator menu > a.pagination-button-disabled { color: var(--kdl-muted-foreground); opacity: 0.5; }
.paginator menu > li:not(.pagination-button-disabled):is(:hover, :focus, :active),
.paginator menu > a:not(.pagination-button-disabled):is(:hover, :focus, :active) {
  background-color: var(--kdl-accent);
  color: var(--kdl-accent-foreground);
}
.paginator menu > li.pagination-button-current, .paginator menu > a.pagination-button-current {
  opacity: 1;
  border-color: var(--kdl-ring);
  background-color: var(--kdl-background);
  color: var(--kdl-foreground);
  box-shadow: var(--kdl-shadow-sm);
}
@media (max-width: 600px) {
  /* Nine buttons fit one 360px row */
  /* Never wraps: the buttons give up width first */
  .paginator menu { flex-wrap: nowrap; gap: 2px; }
  .paginator menu > li, .paginator menu > a { flex: 0 1 2rem; min-width: 1.5rem; height: 2rem; font-size: 13px; }
  .paginator menu > li > b, .paginator menu > a > b { padding: 0 0.35rem; }
  .paginator menu > li:is(.pagination-button-optional, .pagination-desktop),
  .paginator menu > a:is(.pagination-button-optional, .pagination-desktop) { display: none; }
}
/* Wide screens: the "Showing x–y of z" line and the pages share one row, so the bar stays low */
@media (min-width: 601px) {
  .paginator:has(> small):not(:has(.card-list)) { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 16px; }
  .paginator:has(> small):not(:has(.card-list)) > small { text-align: left; white-space: nowrap; }
  .paginator:has(> small):not(:has(.card-list)) > :is(form, menu) { width: auto; margin-left: auto; }
  .paginator:not(:has(.card-list)) menu > :is(li, a) { min-width: 2rem; height: 2rem; font-size: 13px; }
}
@media (min-width: 601px) {
  .paginator menu > li.pagination-mobile:not(:last-child), .paginator menu > a.pagination-mobile:not(:last-child) { display: none; }
}

/* Tabs (creator page) */
.tabs {
  display: flex;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  margin: 4px auto;
  padding: 4px;
  border-radius: var(--kdl-radius);
  background: var(--kdl-muted);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs .tab { display: block; flex: 0 0 auto; height: auto; padding: 0; line-height: 1.25; }
.tabs .tab a {
  display: inline-flex;
  align-items: center;
  height: 1.875rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: calc(var(--kdl-radius) - 2px);
  color: var(--kdl-muted-foreground);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.tabs .tab a:hover { background: transparent; color: var(--kdl-foreground); }
.tabs .tab a.active {
  border: 0;
  background: var(--kdl-background);
  color: var(--kdl-foreground);
  box-shadow: var(--kdl-shadow-sm);
}

/* Site tooltip and filter popovers */
.tooltip {
  max-width: 280px;
  padding: 0.75rem;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background-color: var(--kdl-popover);
  color: var(--kdl-popover-foreground);
  font-size: 13px;
  box-shadow: var(--kdl-shadow);
}
.hide-tags-filter__anchor { font-size: 13px; }
.hide-tags-filter__summary {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px dashed var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  color: var(--kdl-muted-foreground);
  opacity: 1;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.hide-tags-filter__summary:hover, .hide-tags-filter[open] > .hide-tags-filter__summary { background: var(--kdl-accent); color: var(--kdl-foreground); }
.hide-tags-filter__panel {
  padding: 4px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: var(--kdl-popover);
  box-shadow: var(--kdl-shadow);
}
.hide-tags-filter__row, .search-syntax__row { border-radius: calc(var(--kdl-radius) - 2px); padding: 0.375rem 0.5rem; }
.hide-tags-filter__row:hover { background: var(--kdl-accent); }
.hide-tags-filter__panel { min-width: 0; padding: 6px; }
/* Filters moved into the search form's control row (pages.ts): same height as the selects, popover opens to the left */
.hide-tags-filter__anchor[data-kdl-sk="moved"] { margin: 0; display: flex; align-items: stretch; }
.hide-tags-filter__anchor[data-kdl-sk="moved"] .hide-tags-filter { display: flex; }
.hide-tags-filter__anchor[data-kdl-sk="moved"] .hide-tags-filter__summary { height: auto; min-height: 2.25rem; border-style: solid; border-color: var(--kdl-input); }
.hide-tags-filter__anchor[data-kdl-sk="moved"] .hide-tags-filter__panel { top: 100%; left: auto; right: 0; transform: none; }
.hide-tags-filter__row:has(.kdl-sk-seg) { gap: 12px; cursor: default; }
.hide-tags-filter__row:has(.kdl-sk-seg):hover { background: transparent; }
.kdl-sk-seg-source { display: none !important; }
.kdl-sk-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--kdl-radius);
  background: var(--kdl-muted);
}
.kdl-sk-seg__item {
  height: 1.75rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: calc(var(--kdl-radius) - 2px);
  background: transparent;
  color: var(--kdl-muted-foreground);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.kdl-sk-seg__item:hover { color: var(--kdl-foreground); }
.kdl-sk-seg__item:focus-visible { outline: 2px solid var(--kdl-ring); outline-offset: 1px; }
.kdl-sk-seg__item[data-checked] { background: var(--kdl-background); color: var(--kdl-foreground); box-shadow: var(--kdl-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.3)); }
.hide-tags-filter__active, .search-syntax__example { color: var(--kdl-foreground); }
.search-syntax__meaning { color: var(--kdl-muted-foreground); opacity: 1; }

/* Generic site surfaces */
.flash_messages {
  margin: 8px 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: var(--kdl-muted);
}
`;
