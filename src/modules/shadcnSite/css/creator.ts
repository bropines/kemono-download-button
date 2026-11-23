// Creator header as a profile card: banner strip on top, the avatar overlapping it, name and actions
// beside the avatar. Grid instead of the site's flex row; the markup is untouched.

/** The site's other controls in the actions row (Block / Unblock for a logged-in user), matched as "any other site
    control in the row" since their classes may change; a form around one (a POST button) counts too. Shared with
    pages.ts, which gives them a tooltip. */
export const SITE_CONTROL_SELECTOR =
  ':is(.user-header__actions > :is(button, a), .user-header__actions > form > button):not(.user-header__upload, .user-header__favourite, [id^="kdl-"], [class*="kdl-"])';
const SITE_CONTROL = SITE_CONTROL_SELECTOR;
// lucide "ban": the icon the Block button shows when it has no room for its label
const BAN_ICON = "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='m4.9 4.9 14.2 14.2'/%3E%3C/svg%3E\") center / contain no-repeat";
// Visually hidden, still named for screen readers
const SR_ONLY = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;';

export const creatorCss = (): string => `
/* The header is the container of its own narrow layouts (see the end): how many buttons fit depends on its width */
.user-header { container: kdl-user-header / inline-size; }
/* Creator tabs on their own row under the header (moved out of the paginator, see pages.ts) */
.kdl-sk-tabs-row { display: flex; justify-content: center; margin: 16px 0 12px; }
/* "Link another account" on the linked accounts tab */
#add-new-link { max-width: 768px; margin: 0 auto 12px; text-align: center; font-size: 13px; }
#add-new-link a { color: var(--kdl-muted-foreground); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); transition: color 0.15s ease; }
#add-new-link a:is(:hover, :focus-visible) { color: var(--kdl-foreground); text-decoration-color: currentColor; }
.kdl-sk-tabs-row > .tabs { margin: 0; }
.paginator:not(:has(> *)) { display: none; }
.user-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  /* auto: a theme that hides the banner collapses its row */
  grid-template-rows: auto auto;
  /* The same box on every tab of the creator (posts, links, similar creators...) */
  box-sizing: border-box;
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
  box-shadow: var(--kdl-shadow-sm);
}
.user-header__background {
  position: relative;
  z-index: 0;
  grid-column: 1 / -1;
  grid-row: 1;
  width: auto;
  height: 112px;
  background: var(--kdl-muted);
}
.user-header__background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, color-mix(in srgb, var(--kdl-card) 85%, transparent));
}
.user-header__avatar {
  position: relative;
  z-index: 1;
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  width: 96px;
  height: 96px;
  margin: -48px 0 16px 24px;
  border-radius: var(--kdl-radius);
  box-shadow: 0 0 0 4px var(--kdl-card), var(--kdl-shadow);
}
.user-header__info {
  grid-column: 2;
  grid-row: 2;
  gap: 10px;
  padding: 12px 24px 16px 16px;
  color: var(--kdl-card-foreground);
}
.user-header__name { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.025em; }
.user-header__profile { gap: 8px; padding: 0; color: var(--kdl-foreground); }
.user-header__profile:hover { text-decoration: underline; }
.user-header__profile-image { display: inline-flex; flex: 0 0 auto; width: 1.25rem; padding: 0; }
.user-header__profile-image > img { width: 100%; height: auto; }
#kui-copy-username-btn {
  width: 2rem;
  height: 2rem;
  margin-left: 0;
  border: 1px solid transparent;
  border-radius: calc(var(--kdl-radius) - 2px);
  background: transparent;
  color: var(--kdl-muted-foreground);
}
#kui-copy-username-btn:hover { background: var(--kdl-accent); color: var(--kdl-foreground); }
.user-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--kdl-foreground);
  font-size: 14px;
  font-weight: 500;
  text-shadow: none;
}
.user-header__actions > * { margin: 0; }
.user-header__upload, .user-header__favourite {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--kdl-background);
  color: var(--kdl-foreground);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-shadow: none;
  box-shadow: var(--kdl-shadow-sm);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
/* Upload and favourite: icon only; on a pointer device hovering (or keyboard focus) slides the label out.
   The label stays in the accessibility tree either way */
.user-header__actions > :is(.user-header__upload, .user-header__favourite) {
  flex: 0 0 auto; justify-content: center; gap: 0; min-width: 2rem; padding: 0 0.5rem; overflow: hidden;
}
.user-header__actions :is(.user-header__upload > span, .user-header__favourite .user-header__fav-text) {
  display: inline-block;
  max-width: 0;
  margin-left: 0;
  overflow: hidden;
  opacity: 0;
  white-space: nowrap;
  transition: max-width 0.25s ease, margin-left 0.25s ease, opacity 0.2s ease;
}
@media (hover: hover) {
  .user-header__actions > :is(.user-header__upload, .user-header__favourite):is(:hover, :focus-visible) :is(span:not(.user-header__fav-icon)) {
    max-width: 14rem;
    margin-left: 6px;
    opacity: 1;
  }
}
.user-header__upload::before {
  content: '';
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' x2='12' y1='3' y2='15'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' x2='12' y1='3' y2='15'/%3E%3C/svg%3E") center / contain no-repeat;
}
.user-header__upload:is(:hover, :focus), .user-header__favourite:hover { background: var(--kdl-accent); color: var(--kdl-accent-foreground); }
.user-header__favourite :is(.user-header__fav-icon, .user-header__fav-text) { color: inherit; }
.user-header__favourite .user-header__fav-icon { color: var(--kdl-warning); }
.user-header__favourite--unfav { border-color: color-mix(in srgb, var(--kdl-warning) 45%, var(--kdl-input)); }
/* Buttons the site adds later (Block, for logged-in users) get the same outline look, with a red tint on hover.
   Matched as "any other site control in the row", since their classes may change */
${SITE_CONTROL} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  background: var(--kdl-background);
  color: var(--kdl-muted-foreground);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  text-shadow: none;
  box-shadow: var(--kdl-shadow-sm);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  /* A destructive action: last in the row, after our hide button (order 1) */
  order: 2;
}
.user-header__actions > form { display: contents; }
/* Our hide button is as tall as the buttons beside it */
.user-header__actions > .kdl-hide-own > .kdl-ui-btn { width: 2rem; height: 2rem; }
${SITE_CONTROL} * { color: inherit; font: inherit; }
${SITE_CONTROL}:is(:hover, :focus-visible) {
  border-color: color-mix(in srgb, var(--kdl-danger) 55%, var(--kdl-input));
  background: color-mix(in srgb, var(--kdl-danger) 12%, var(--kdl-background));
  color: var(--kdl-danger);
}
/* Strips under the tabs (similar creators, overview): the scrolling rows fade out at the right edge while there is
   more to scroll, so a chip is never cut off without a hint. Scroll-driven, so without support they simply stay hard-edged */
@property --kdl-sk-fade { syntax: '<length>'; inherits: false; initial-value: 28px; }
@keyframes kdl-sk-fade-end { from, 92% { --kdl-sk-fade: 28px; } to { --kdl-sk-fade: 0px; } }
@supports (animation-timeline: scroll()) {
  .kdl-sim__scroll, .kdl-ov__scroll {
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--kdl-sk-fade)), transparent);
    mask-image: linear-gradient(to right, #000 calc(100% - var(--kdl-sk-fade)), transparent);
    animation: kdl-sk-fade-end linear both;
    animation-timeline: scroll(self inline);
  }
}
.kdl-sim__title, .kdl-ov__title { letter-spacing: 0; }
/* Phones, two rows under the banner: the avatar with the name and the post-count badge beside it, then one row of
   buttons. Every button but "Post manager" is a 36px square with a tooltip (the Block button too: its label is
   kept for screen readers, see pages.ts); the manager keeps its label while it fits and turns into a square
   when the row is crowded (container queries below) */
@media (max-width: 600px) {
  .user-header__info { display: contents; }
  .user-header__avatar { grid-row: 2 / span 2; }
  .user-header__name { grid-column: 2; grid-row: 2; align-self: end; min-width: 0; padding: 10px 16px 4px 12px; }
  .user-header__info > .kdl-info { grid-column: 2; grid-row: 3; align-self: start; min-width: 0; margin: 0; padding: 0 16px 12px 12px; }
  .user-header__actions { grid-column: 1 / -1; grid-row: 4; display: flex; flex-wrap: nowrap; gap: 6px; padding: 0 16px 16px; }
  .user-header__actions > * { flex: 0 0 auto; min-width: 0; }
  .user-header__actions > #kdl-author-manager-btn { display: flex; flex: 1 1 auto; min-width: 2.25rem; }
  .user-header__actions > #kdl-author-manager-btn > .kdl-ui-btn { flex: 1 1 auto; width: 100%; min-width: 0; height: 2.25rem; padding: 0 8px; }
  .user-header__actions .kdl-ui-btn > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .user-header__upload, .user-header__favourite { justify-content: center; height: 2.25rem; padding: 0 0.625rem; }
  .user-header__actions > :is(.user-header__favourite, .user-header__upload) { flex: 0 0 2.25rem; width: 2.25rem; padding: 0; }
  ${SITE_CONTROL} { flex: 0 0 2.25rem; width: 2.25rem; height: 2.25rem; padding: 0; gap: 0; font-size: 0; }
  ${SITE_CONTROL}::before { content: ''; flex: 0 0 auto; width: 16px; height: 16px; background: currentColor; -webkit-mask: ${BAN_ICON}; mask: ${BAN_ICON}; }
  .user-header__actions > #kdl-tags-btn .kdl-ui-btn { width: 2.25rem; height: 2.25rem; padding: 0; gap: 0; }
  .user-header__actions > #kdl-tags-btn .kdl-ui-btn > span { display: none; }
  .user-header__actions > .kdl-hide-own > .kdl-ui-btn { width: 2.25rem; height: 2.25rem; }
  .user-header__favourite .user-header__fav-icon { font-size: 16px; }
}
/* A crowded row: the manager's label goes too (it keeps its tooltip). Five buttons (anonymous) leave it room down
   to a ~350px card, six (signed in: Block) down to ~400px */
@container kdl-user-header (max-width: 349px) {
  .user-header__actions { justify-content: space-between; }
  .user-header__actions > #kdl-author-manager-btn { flex: 0 0 auto; }
  .user-header__actions > #kdl-author-manager-btn > .kdl-ui-btn { width: 2.25rem; padding: 0; gap: 0; }
  .user-header__actions > #kdl-author-manager-btn > .kdl-ui-btn > span { ${SR_ONLY} }
}
@container kdl-user-header (max-width: 399px) {
  /* A row of equal squares, spread over the card instead of bunched up on the left */
  .user-header__actions:has(> :nth-child(6)) { justify-content: space-between; }
  .user-header__actions:has(> :nth-child(6)) > #kdl-author-manager-btn { flex: 0 0 auto; }
  .user-header__actions:has(> :nth-child(6)) > #kdl-author-manager-btn > .kdl-ui-btn { width: 2.25rem; padding: 0; gap: 0; }
  .user-header__actions:has(> :nth-child(6)) > #kdl-author-manager-btn > .kdl-ui-btn > span { ${SR_ONLY} }
}
@media (max-width: 480px) {
  .user-header__background { height: 88px; }
  .user-header__avatar { width: 72px; height: 72px; margin: -36px 0 12px 16px; }
  .user-header__name { font-size: 1.25rem; }
}

`;
