// Creator header as a profile card: banner strip on top, the avatar overlapping it, name and actions
// beside the avatar. Grid instead of the site's flex row; the markup is untouched.

export const creatorCss = (): string => `
.user-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  /* auto: a theme that hides the banner collapses its row */
  grid-template-rows: auto auto;
  max-width: 960px;
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
.user-header__upload:is(:hover, :focus), .user-header__favourite:hover { background: var(--kdl-accent); color: var(--kdl-accent-foreground); }
.user-header__favourite :is(.user-header__fav-icon, .user-header__fav-text) { color: inherit; }
.user-header__favourite .user-header__fav-icon { color: var(--kdl-warning); }
.user-header__favourite--unfav { border-color: color-mix(in srgb, var(--kdl-warning) 45%, var(--kdl-input)); }
@media (max-width: 480px) {
  .user-header__background { height: 88px; }
  .user-header__avatar { width: 72px; height: 72px; margin: -36px 0 12px 16px; }
  .user-header__info { padding: 10px 16px 16px 12px; }
  .user-header__name { font-size: 1.25rem; }
}

`;
