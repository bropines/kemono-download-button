// Site forms: shadcn checkboxes and radios, the importer / account forms as a card with hover and focus
// states, and compact one-row filter bars (favourites type/sort/order, creators search, popular periods).

import { NK } from './base';

const CHECK = `input[type=checkbox]${NK}`;
const RADIO = `input[type=radio]${NK}`;
const TOGGLES = `input:is([type=checkbox], [type=radio])${NK}`;

// Filter bars: label + select pairs, wrapped or not. The account keys form is a list, not a bar
const FILTER_BARS = [
  '.site-section--favorites :is(.dropdowns, form):not(.search-form, :has(.card-list))',
  '.site-section--favorites > :is(div, p):has(> .favorites-opts)',
].join(', ');
const FILTER_ITEMS = ':is(.favorites-opts, div, p, span, fieldset):has(> select)';

export const formsCss = (): string => `
/* Checkboxes and radios (the script's own kit checkboxes are excluded by NK) */
${TOGGLES} {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  display: inline-grid;
  place-content: center;
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  min-width: 1rem;
  min-height: 1rem;
  margin: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--kdl-primary) 55%, var(--kdl-input));
  border-radius: 4px;
  background: transparent no-repeat center / 12px;
  box-shadow: var(--kdl-shadow-sm);
  vertical-align: -0.15em;
  cursor: pointer;
  opacity: 1;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
${RADIO} { border-radius: 9999px; }
${TOGGLES}::before, ${TOGGLES}::after { content: none; }
/* The importer draws an X / tick with ::before at (0,3,1) */
.form__section--checkbox .form__input:is(:checked, :not(:checked))::before { content: none; }
${TOGGLES}:hover { border-color: var(--kdl-primary); }
${TOGGLES}:focus { outline: none; }
${TOGGLES}:focus-visible { box-shadow: var(--kdl-focus-ring); }
${CHECK}:is(:checked, :indeterminate) {
  border-color: var(--kdl-primary);
  background-color: var(--kdl-primary);
}
${CHECK}:checked { background-image: var(--kdl-check); }
${CHECK}:indeterminate { background-image: var(--kdl-dash); }
${RADIO}:checked {
  border-color: var(--kdl-primary);
  background-image: radial-gradient(circle, var(--kdl-primary) 0 3.5px, transparent 4px);
}
${TOGGLES}:disabled { cursor: not-allowed; opacity: 0.5; }

/* Site forms (importer, login, account settings) */
.form--bigger, .site-section--account .form:not(#revoke-service-keys), .site-section--new-linked-account .form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 40rem;
  margin: 16px auto;
  padding: 24px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  color: var(--kdl-card-foreground);
  box-shadow: var(--kdl-shadow-sm);
  box-sizing: border-box;
}
.form__section { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; }
.form__section--hidden { display: none; }
.form__label { color: var(--kdl-foreground); font-size: 14px; font-weight: 500; line-height: 1.4; opacity: 1; }
.form__label--disabled { color: var(--kdl-muted-foreground); }
.form__subtitle { margin-top: 2px; color: var(--kdl-muted-foreground); font-size: 12.5px; font-weight: 400; line-height: 1.5; }
:is(.form__input, .form__select)${NK}:not([type=checkbox], [type=radio]) { width: 100%; min-height: 2.5rem; box-sizing: border-box; }
:is(.form__input, .form__select)${NK}:not([type=checkbox], [type=radio]):hover {
  background-color: color-mix(in srgb, var(--kdl-accent) 45%, transparent);
}
.form__section:has(> :is(.form__input, .form__select):focus-visible) > .form__label { color: var(--kdl-ring); }
.form__button--submit { width: 100%; max-width: none; min-height: 2.5rem; }

/* Checkbox rows: the whole row is the hit area */
.form__section--checkbox {
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.form__section--checkbox:not(:has(:disabled)):hover { border-color: var(--kdl-hover-ring); background: color-mix(in srgb, var(--kdl-accent) 60%, transparent); }
.form__section--checkbox:has(:focus-visible) { border-color: var(--kdl-ring); box-shadow: var(--kdl-focus-ring); }
.form__section--checkbox:has(:checked) { border-color: color-mix(in srgb, var(--kdl-primary) 45%, var(--kdl-border)); }
.form__section--checkbox:has(:disabled) { cursor: not-allowed; }
.form__section--checkbox > .form__input { margin-top: 2px; }
.form__section--checkbox > .form__label { flex: 1 1 auto; opacity: 1; cursor: inherit; }
.form__section--checkbox > .form__label br { display: none; }
.form__section--checkbox .form__subtitle { display: block; margin-top: 4px; }

/* Compact filter bars: one row that wraps on phones */
${FILTER_BARS} {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  gap: 8px 16px;
  width: fit-content;
  max-width: 100%;
  margin: 8px auto 12px;
  padding: 8px 12px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  box-shadow: var(--kdl-shadow-sm);
  box-sizing: border-box;
  text-align: left;
}
:is(${FILTER_BARS}) ${FILTER_ITEMS} { display: inline-flex; align-items: center; gap: 8px; margin: 0; padding: 0; float: none; }
:is(${FILTER_BARS}) br { display: none; }
:is(${FILTER_BARS}) label { margin: 0; color: var(--kdl-muted-foreground); font-size: 13px; font-weight: 500; white-space: nowrap; }
:is(${FILTER_BARS}) select${NK} {
  width: auto;
  min-width: 0;
  min-height: 2rem;
  height: 2rem;
  margin: 0;
  padding: 0 1.9rem 0 0.625rem;
  font-size: 13px;
  background-position: right 0.5rem center;
}

/* Creators search: input and controls on one line on wide screens */
.search-form { flex-flow: row wrap; align-items: center; max-width: 56rem; }
.search-form > .search-input${NK} { flex: 1 1 16rem; width: auto; max-width: none; }
.search-form__controls { flex: 1 1 18rem; flex-wrap: nowrap; }
.search-form__controls select${NK} { min-height: 2.25rem; font-size: 13px; }

/* Popular posts: the day / week / month pagers as one segmented row */
#paginator-dates {
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
#paginator-dates > div[id]:not(.paginator) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--kdl-border);
  border-radius: var(--kdl-radius);
  background: var(--kdl-muted);
  font-size: 13px;
}
#paginator-dates > div[id]:not(.paginator) > span > :is(a, span) {
  display: inline-flex;
  align-items: center;
  height: 1.75rem;
  padding: 0 0.6rem;
  border-radius: calc(var(--kdl-radius) - 2px);
  color: var(--kdl-muted-foreground);
  white-space: nowrap;
}
#paginator-dates > div[id]:not(.paginator) > span:nth-child(2) > a { background: var(--kdl-background); color: var(--kdl-foreground); font-weight: 500; box-shadow: var(--kdl-shadow-sm); }
#paginator-dates > div[id]:not(.paginator) > span > a:hover { background: var(--kdl-accent); color: var(--kdl-foreground); }
#paginator-dates > div[id]:not(.paginator) > span > span { opacity: 0.45; }
#paginator-dates > .paginator { flex: 1 0 100%; }

@media (max-width: 600px) {
  /* The control row (service, sort, direction, filters) wraps instead of pushing the page wider than the phone */
  .search-form__controls { flex-wrap: wrap; min-width: 0; }
  .search-form__controls select${NK} { flex: 1 1 8rem; min-width: 0; }
  .form--bigger, .site-section--account .form:not(#revoke-service-keys), .site-section--new-linked-account .form { padding: 16px; }
  .form__section--checkbox { padding: 10px 12px; }
}
`;
