// Post cards (thumbnail on top, title and a meta line below) and creator cards.
// The card grid keeps --card-size, so the grid size module still sets the column width; the script's
// checkbox, download controls and quick favourite stay absolutely placed over the thumbnail.

export const cardsCss = (): string => `
.card-list { padding: 8px 0; }
.card-list__items:has(> .post-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--card-size, 180px), 100%), 1fr));
  align-items: stretch;
  gap: 16px;
}
/* Two 180px columns still fit a 390px phone */
@media (max-width: 600px) {
  .card-list__items:has(> .post-card) { gap: 8px; }
}

.post-card {
  width: auto;
  height: auto;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  color: var(--kdl-card-foreground);
  font-size: 13px;
  text-align: left;
  text-shadow: none;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}
.post-card:is(:hover, :focus-within) {
  border-color: var(--kdl-hover-ring);
  box-shadow: 0 0 0 1px var(--kdl-hover-ring), var(--kdl-shadow);
}
/* The site marks favourites after load with a 2px border: kept at 1px (plus a ring, which takes no room), so the card does not change size */
.post-card.post-card--fav { border-width: 1px; border-style: solid; border-color: color-mix(in srgb, var(--kdl-warning) 60%, var(--kdl-border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--kdl-warning) 35%, transparent); }
.post-card > a {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  border: 0;
  color: inherit;
}
.post-card:hover > a, .post-card > a:is(:active, :focus) { top: 0; }
.post-card > a:not(:hover):not(:active):not(:focus), .post-card > a:is(:hover, :active, :focus) { background: transparent; color: inherit; }
.post-card__image-container {
  position: relative;
  inset: auto;
  order: -1;
  flex: 0 1 auto;
  min-height: 0;
  aspect-ratio: var(--kdl-sk-thumb, 1 / 1);
  background: var(--kdl-muted);
  overflow: hidden;
}
.post-card__image { transition: transform 0.3s ease; }
/* Text-only posts get a placeholder the size of a thumbnail: the grid stays even and the selection checkbox
   sits on it instead of over the title */
.post-card > a:not(:has(.post-card__image-container))::before {
  content: '';
  order: -1;
  flex: 0 0 auto;
  aspect-ratio: var(--kdl-sk-thumb, 1 / 1);
  background: var(--kdl-muted) url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-opacity='0.55' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/%3E%3Cpath d='M14 2v4a2 2 0 0 0 2 2h4'/%3E%3Cpath d='M10 9H8'/%3E%3Cpath d='M16 13H8'/%3E%3Cpath d='M16 17H8'/%3E%3C/svg%3E") center / 28% no-repeat;
}
.post-card:hover .post-card__image { transform: scale(1.03); }
.post-card__header {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  min-height: calc(2em * 1.35);
  padding: 10px 12px 2px;
  color: var(--kdl-card-foreground);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.01em;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.post-card__footer { margin-top: auto; padding: 6px 12px 12px; color: var(--kdl-muted-foreground); font-size: 12px; }
.post-card--preview :is(.post-card__header, .post-card__footer) { background: none; }
.post-card__footer > div { display: flex; align-items: center; gap: 8px; color: var(--kdl-muted-foreground); }
.post-card__footer > div > div { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; }
.post-card__footer > div > div > time { color: var(--kdl-muted-foreground); white-space: nowrap; }
.post-card__footer > div > div > div {
  display: inline-block;
  min-height: 1.25rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--kdl-border);
  /* the popular page puts two lines in it (attachments, favourites) */
  border-radius: 0.625rem;
  line-height: 1.3;
  background: var(--kdl-secondary);
  color: var(--kdl-secondary-foreground);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.post-card__footer > div > img { flex: 0 0 auto; width: 16px; height: 16px; margin-left: auto; border-radius: 4px; }

/* Creator cards (artists, favourites, linked accounts, similar creators) */
.card-list__items:has(> .user-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 12px;
}
.card-list__items:has(> .user-card) > * { max-width: none; min-width: 0; }
/* The site caps creator list pages at 768px (two columns): the card grid gets the full width,
   the search form, filters and pagination stay a centred column */
.site-section:has(.card-list__items > .user-card) { max-width: min(100%, 1800px); }
.site-section:has(.card-list__items > .user-card) > :not(.card-list, .user-header, .kdl-sk-tabs-row) { max-width: 768px; margin-inline: auto; }
.site-section:has(.card-list__items > .user-card) .card-list > :not(.card-list__layout, .card-list__items) { max-width: 768px; margin-inline: auto; }
.user-card {
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
  box-shadow: none;
  color: var(--kdl-card-foreground);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.user-card:is(:hover, :focus-within) {
  top: 0;
  border-color: var(--kdl-hover-ring);
  box-shadow: 0 0 0 1px var(--kdl-hover-ring), var(--kdl-shadow);
}
/* The site marks favourites after load with a 2px border: kept at 1px (plus a ring, which takes no room), so the card does not change size */
.user-card.user-card--fav { border-width: 1px; border-style: solid; border-color: color-mix(in srgb, var(--kdl-warning) 60%, var(--kdl-border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--kdl-warning) 35%, transparent); }
.user-card__icon { flex: 0 0 auto; width: 64px; height: 64px; overflow: hidden; border-radius: var(--kdl-radius); box-shadow: 0 0 0 1px var(--kdl-border); }
/* The avatar inside keeps the site's own size and offset otherwise, and slides out of the frame */
.user-card__icon :is(.user-card__user-icon, .fancy-image, .fancy-image__picture) {
  display: block; position: static; width: 100%; height: 100%; margin: 0; padding: 0; transform: none; border-radius: 0;
}
.user-card__icon .fancy-image__image { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 0; }
.user-card__info { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; padding: 0; overflow: hidden; }
/* Long creator names end with an ellipsis: unbroken, they widened the grid past the screen on phones */
.user-card__name { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-card__service {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.user-card__name { padding: 0; color: var(--kdl-foreground); font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
/* The site's banner image sits behind the text: a soft shadow keeps it readable on bright banners */
.user-card__count, .user-card__updated { color: color-mix(in srgb, var(--kdl-foreground) 85%, transparent); font-size: 12px; }
.user-card__name, .user-card__count, .user-card__updated { text-shadow: 0 1px 3px rgb(0 0 0 / 0.55); }

/* Other site cards: DMs, generic cards, account cards */
.card, .dm-card, .account-card, .desc-list, .jumbo, .navigation__list--local {
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
  color: var(--kdl-card-foreground);
}
.card:is(:hover, :focus-within), .dm-card:is(:hover, :focus-within) { border-color: var(--kdl-hover-ring); box-shadow: 0 0 0 1px var(--kdl-hover-ring); }
.card--no-results:hover { border-color: var(--kdl-border); box-shadow: none; }
/* DM and announcement cards in a grid of readable columns (the DM viewer module refines them on /dms) */
.card-list__items:has(> .dm-card) { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)) !important; align-items: stretch; gap: 12px; }
.card-list__items > .dm-card { width: auto !important; max-width: none; min-width: 0; margin: 0; }
.dm-card > * { padding: 12px 16px; }
.dm-card__content { color: color-mix(in srgb, var(--kdl-foreground) 90%, transparent); line-height: 1.6; }
/* Tag clouds (site tags, creator tags) and announcements */
section#tag-container { gap: 6px; }
section#tag-container article {
  margin: 0;
  border: 1px solid var(--kdl-border);
  border-radius: 9999px;
  background-color: var(--kdl-secondary);
  overflow: hidden;
}
section#tag-container article a { display: inline-flex; align-items: center; border-radius: 9999px; color: var(--kdl-secondary-foreground); }
section#tag-container article a:hover { background: color-mix(in srgb, var(--kdl-secondary) 75%, var(--kdl-foreground)); }
section#tag-container article span { padding: 0.25rem 0.625rem; font-size: 13px; }
section#tag-container article span:nth-child(2) { padding-left: 0; color: var(--kdl-muted-foreground); }
.announcement-title-container { align-items: baseline; gap: 12px; }
.announcement-text, .date { color: var(--kdl-muted-foreground); }

`;
