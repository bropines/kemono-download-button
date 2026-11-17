// Post page: header card, meta, tags, flag/favourite buttons, content prose and comments.
// Flag and favourite need !important: the downloader's post action styles already use it.

const OUTLINE_BTN = `
  min-height: 2rem !important;
  padding: 0 0.75rem !important;
  border: 1px solid var(--kdl-input) !important;
  border-radius: calc(var(--kdl-radius) - 2px) !important;
  background: var(--kdl-background) !important;
  color: var(--kdl-foreground) !important;
  font-family: inherit !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
  text-shadow: none !important;
  box-shadow: var(--kdl-shadow-sm) !important;
  transform: none !important;
`;

export const postCss = (): string => `
.site-section--post { max-width: 1100px; margin-inline: auto; }

.post__nav-list { height: auto; margin: 0 0 12px; }
.post__nav-link {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid var(--kdl-input);
  border-radius: calc(var(--kdl-radius) - 2px);
  color: var(--kdl-foreground);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--kdl-shadow-sm);
}
.post__nav-link:is(:hover, :focus) { background: var(--kdl-accent); color: var(--kdl-accent-foreground); }

/* Header card */
.post__header {
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-card);
  box-shadow: var(--kdl-shadow-sm);
}
.post__user {
  display: flex;
  flex: 0 0 200px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 16px;
  border-right: 1px solid var(--kdl-border);
  background-color: color-mix(in srgb, var(--kdl-card) 55%, transparent);
  isolation: isolate;
}
.post__user > .fancy-image--background { opacity: 0.35; }
.post__user-profile {
  width: 112px;
  height: 112px;
  border-radius: var(--kdl-radius);
  box-shadow: 0 0 0 1px var(--kdl-border), var(--kdl-shadow);
}
.post__user-name { padding: 0; color: var(--kdl-foreground); font-size: 15px; font-weight: 600; }
.post__user-name:hover { text-decoration: underline; }
.post__info { gap: 6px; padding-top: 20px; padding-bottom: 20px; padding-left: 24px; background-color: transparent; }
.post__info > * { margin: 0; }
.post__title { margin-bottom: 4px; font-size: 1.5rem; font-weight: 700; line-height: 1.25; letter-spacing: -0.025em; }
.post__title > span + span { color: var(--kdl-muted-foreground); font-size: 0.7em; font-weight: 500; letter-spacing: 0; }
.post__published, .post__added, .post__edited { color: var(--kdl-muted-foreground); font-size: 13px; }
/* The site gives the label a fixed 89px: longer (translated) labels broke mid-word */
.post__published > div, .post__added div, .post__edited > div { width: auto !important; min-width: 89px; margin-right: 6px; white-space: nowrap; }
section#post-tags { align-items: center; gap: 6px; margin: 2px 0; font-size: 13px; }
section#post-tags span#label { color: var(--kdl-muted-foreground); }
section#post-tags > div { flex-wrap: wrap; gap: 4px; overflow: visible; }
section#post-tags > div > a {
  margin: 0;
  padding: 0.125rem 0.5rem;
  border: 1px solid transparent;
  border-radius: calc(var(--kdl-radius) - 2px);
  background-color: var(--kdl-secondary);
  color: var(--kdl-secondary-foreground);
  font-size: 12px;
  font-weight: 500;
}
section#post-tags > div > a:hover { background-color: color-mix(in srgb, var(--kdl-secondary) 75%, var(--kdl-foreground)); }
section#post-tags #show-tag-overflow-button { color: var(--kdl-muted-foreground); font-size: 12px; }
.post__actions { font-size: 14px; }
.post__flag, .post__fav { ${OUTLINE_BTN} }
.post__flag:hover, .post__fav:hover { background: var(--kdl-accent) !important; border-color: var(--kdl-input) !important; box-shadow: var(--kdl-shadow-sm) !important; }
.post__flag:focus-visible, .post__fav:focus-visible { box-shadow: var(--kdl-focus-ring) !important; }
.post__flag span, .post__fav span { color: inherit !important; }
.post__flag .post__flag-icon, .post__flag:hover .post__flag-icon { color: var(--kdl-danger) !important; }
.post__fav .post__fav-icon, .post__fav:hover .post__fav-icon { color: var(--kdl-warning) !important; }
.post__flag.post__flag--flagged, .post__flag.post__flag--flagged .post__flag-icon { color: var(--kdl-muted-foreground) !important; }
.post__fav.post__fav--unfav { border-color: color-mix(in srgb, var(--kdl-warning) 45%, var(--kdl-input)) !important; }
@media (max-width: 849px) {
  .post__header { flex-wrap: wrap; }
  .post__header > .kdl-actions-container { flex: 1 1 100%; margin: 0; padding: 0 16px 16px; }
}
@media (max-width: 480px) {
  .post__user { flex-basis: auto; flex-direction: row; justify-content: flex-start; padding: 12px 16px; border-right: none; border-bottom: 1px solid var(--kdl-border); }
  .post__user-profile { width: 56px; height: 56px; margin: 0; }
  .post__info { padding: 16px; }
  .post__title { font-size: 1.25rem; }
}

/* Body */
.post__body { padding: 8px 0; border: 0; }
.post__body > h2, .kui-post-section > h2, .post__footer > h2 {
  border-bottom-color: var(--kdl-border) !important;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.post__content { max-width: 80ch; color: color-mix(in srgb, var(--kdl-foreground) 92%, transparent); font-size: 15px; line-height: 1.7; }
.post__content p { margin: 0 0 1em; padding: 0; }
.post__content a {
  color: var(--kdl-foreground);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--kdl-ring) 70%, transparent);
}
.post__content a:hover { text-decoration-color: var(--kdl-foreground); }
.post__content img { border-radius: var(--kdl-radius); }
.post__content blockquote { margin: 1em 0; padding-left: 1em; border-left: 2px solid var(--kdl-border); color: var(--kdl-muted-foreground); }
.post__content pre { padding: 0.75rem 1rem; border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-muted); }
.post__attachment-link--missing { color: var(--kdl-muted-foreground); }
.post__thumbnail img { border-radius: var(--kdl-radius); }
.post__thumbnail figcaption { background: none; color: var(--kdl-muted-foreground); font-size: 12px; }
.post__cta, article#poll {
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
  color: var(--kdl-muted-foreground);
}

/* Surface panels (transparent at flat contrast): each post section, the outer one when they nest */
.kui-post-section:not(.kui-post-section .kui-post-section), .post__footer {
  margin-top: 16px;
  padding: var(--kdl-panel-pad);
  border: 1px solid var(--kdl-panel-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background: var(--kdl-panel-bg);
}
.kui-post-section .kui-post-section { margin-top: 0; padding: 0; }

/* Comments (the card layouts of the post module bring their own card look) */
.post__comments:not(.kui-comments--grid):not(.kui-comments--carousel) > .comment {
  max-width: 720px;
  padding: 12px 16px;
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-card);
}
.post__comments:not(.kui-comments--grid):not(.kui-comments--carousel) > .comment > * { padding: 4px 0; border: 0; }
.comment__name { color: var(--kdl-foreground); font-weight: 600; }
.comment__message { color: color-mix(in srgb, var(--kdl-foreground) 90%, transparent); }
.comment__icon { width: 1.5rem; height: 1.5rem; border-radius: 9999px; vertical-align: middle; }
.comment--user .comment__name::after {
  content: 'Creator';
  display: inline-flex;
  align-items: center;
  height: 1.125rem;
  margin-left: 6px;
  padding: 0 0.4rem;
  border-radius: 9999px;
  background: var(--kdl-primary);
  color: var(--kdl-primary-foreground);
  font-size: 10px;
  font-weight: 600;
  vertical-align: middle;
}
.comment:target { outline: 2px solid var(--kdl-ring); outline-offset: 2px; }
.comment-has-revisions { color: var(--kdl-muted-foreground); font-size: 12px; }
.comment__header .comment-revisions-dialog > div { background: var(--kdl-overlay); }
.comment__header .comment-revisions-dialog > div > div {
  border: 1px solid var(--kdl-border);
  border-radius: calc(var(--kdl-radius) + 4px);
  background-color: var(--kdl-background);
  box-shadow: var(--kdl-shadow);
}
.comment__header .comment-revisions-dialog > div > div main { color: var(--kdl-foreground); }
`;
