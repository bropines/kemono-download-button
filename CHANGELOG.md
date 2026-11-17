# Changelog

User-facing changes to the userscript. Every push to `main` reaches users through auto-update; tagged versions also get a [GitHub Release](https://github.com/bropines/kemono-download-button/releases), whose notes come from this file.

## [Unreleased]

### Added
- **Import status page** (module "Import status page", on by default): the status is a coloured badge (done, failed, in progress with a pulse, waiting); a summary shows creators, posts added, unchanged, flagged and errors; log lines are typed with icons and colours, indented under their creator, with links to each post and creator; a toolbar filters by kind (all, posts, creators, problems), searches the log, follows new lines and copies the whole log. The card and buttons of the page are translated.

## [1.4.3] - 2026-11-17

### Changed
- Site skin: the creator header's upload and favourite buttons are icon-only; on desktop they slide their label out on hover.

## [1.4.2] - 2026-11-17

### Changed
- Site skin: the creator header's "Upload file" button has an upload icon.

## [1.4.1] - 2026-11-17

### Changed
- Site skin on phones: the creator header puts the name beside the avatar and the actions (all posts, upload, favourite) in one compact row; the favourite button shows just its star.

## [1.4.0] - 2026-11-17

### Changed
- **No more flash of the old look when a page opens in a new tab.** The script now starts with the document (`@run-at document-start`): the site skin, its colours and width, and the styles of every enabled module are in place before the first paint, and the site menus are translated while the page is still loading. Everything else still starts once the page is ready. (AdGuard may start scripts later, so it can still flash there.)

## [1.3.9] - 2026-11-17

### Fixed
- The Modules tab was cut off in the settings dialog: on desktop the tabs show labels only and all fit one row; phones keep icons and scroll the row.
- Russian: the creator tab "Linked Accounts (✔️)" reads "Связанные аккаунты" without the site's checkmark.

## [1.3.8] - 2026-11-17

### Added
- Site skin: **Page width** setting (Normal 1100px, Wide 1600px, Full width), Wide by default. The post page and its text follow it: the text column grows from 80 to 120 characters on Wide and has no limit on Full.

## [1.3.7] - 2026-11-17

### Fixed
- Site skin: posts without a picture get a thumbnail-sized placeholder, so the selection checkbox no longer covers their title and the card grid stays even.

## [1.3.6] - 2026-11-17

### Fixed
- Site skin: long creator names end with an ellipsis; on phones they no longer widen the creator list past the screen.
- Site skin on phones: the home page art keeps one fixed height, so it no longer jumps while the address bar slides in and out.

## [1.3.5] - 2026-11-17

### Added
- **Touch gestures in the image viewer:** pinch to zoom around your fingers, drag to pan, double tap to zoom in or back to fit, swipe left/right to change picture. Mouse and wheel work as before.

### Fixed
- Site skin on phones: the post page download buttons fit the screen (long labels shorten with an ellipsis, one column on narrow phones); "Published:" / "Imported:" labels no longer break mid-word.
- Site skin on phones: the pagination never wraps; the menu button in the top bar scrolls with the links instead of floating over them.
- Site skin on phones: the home page art no longer rescales while the address bar hides and shows.
- Site skin: the contact page mail addresses are buttons.

## [1.3.4] - 2026-11-17

### Fixed
- Site skin on phones: the creators search row (service, sort, direction, filters) wraps instead of making the whole page wider than the screen.
- Site skin on phones: the pagination fits one row.

## [1.3.3] - 2026-11-17

### Changed
- Site skin: footer links are small buttons without the brackets, on every page.
- Site skin: the API page sizes its Swagger frame to the content, so the page has a single scrollbar (it grows and shrinks as sections open and close).
- Site skin: the Filters button sits in the search row on creator lists; the "Showing 1–50 of N" line is a bit smaller.

### Fixed
- The site translation is applied before the page is drawn, so switching pages no longer shows English text for a moment.

## [1.3.2] - 2026-11-17

### Changed
- Site skin: the site's tag filter (Filters → AI-generated: Show / Hide / Only) is a segmented switch instead of a dropdown.
- Our panels and dialogs use thin scrollbars in the interface colours; the settings tabs wrap onto a second row instead of hiding the last ones.
- Site skin: the home page footer has no rule line and its links sit in a readable pill over the art.

### Fixed
- After switching pages the site's text stayed in English for a while: the site translation (and other features that run on every page) now update right after navigation.
- Site skin: creator avatars in lists no longer slip out of their frame.

## [1.3.1] - 2026-11-17

### Fixed
- Site skin: the creator lists (artists, favourites) use the full width instead of two columns.
- Site skin: the home page art is shown sharp again; only the sidebar and the welcome card blur what is behind them, and the footer is back to normal.
- The debug overlay no longer shows as an empty black square in the corner when debug mode is on.

## [1.3.0] - 2026-11-17

Languages, smarter lists and a polished site skin.

### Added
- **Languages.** The script's interface and the site's own menus, buttons, headings and pagination can be shown in Russian (more languages can be added). Post titles, texts, comments, names and tags are never translated. Language is picked in General settings (Auto follows the browser); translations update from GitHub once a day and work offline. Anyone can contribute a language with a pull request — see `locales/README.md`.
- **Tag tools** on tag pages: instant search, sorting by count or name, A–Z groups with a jump bar, and a filter by script (Latin, Cyrillic, CJK).
- **Live post search** on creator pages and /posts: results appear as you type, with "Load more"; download buttons and checkboxes work on them. Enter still runs the site's full search, Esc brings the list back.
- **Download buttons on every post list**: /posts, popular, search and favourite posts, not only creator pages.
- **Theme previews**: every preset and theme shows a small sketch of the page, and holding the eye button previews it on the current page. Colour swatches for the skin's accent and tone in the Modules tab.
- Site skin: FAQ as a searchable accordion, importer notes and account pages as panels, a blurred full-page art background on the home page.

### Changed
- Site skin: compact one-row filter forms (favourites, artists, popular), shadcn-style checkboxes and radios, clear hover and focus states on forms, a scrollable header and many layout fixes on phones; the settings tabs no longer overlap on narrow screens.
- The smoke test no longer depends on the interface language.

### Fixed
- The site skin and themes no longer flash back to the old look while switching pages: the site deleted our styles on every navigation.
- Pages opened in a background tab are set up right away instead of when you switch to them.

## [1.2.0] - 2026-11-17

A shadcn-style skin for the whole site.

### Added
- **Site skin (Modules → Interface → shadcn site skin, off by default).** Restyles the site itself in the shadcn/ui look: grouped sidebar with an active-page marker, blurred header, kit-style buttons, inputs, tabs and pagination, card-style post cards with badges, a profile card for creators, a post page with a header card and separate panels for files, content and comments, plus the artists, popular, tags and DM pages. Phone width is supported. Parts for cards, the post page and the creator page can be switched off one by one, and turning the skin off restores the site instantly.
- **Accent colour** (zinc, blue, violet, rose, orange, green, amber or your own hex), **base tone** (Zinc, Black OLED, Neutral grey, Slate, Stone, Dim) and **surface contrast** (flat, subtle, strong) for the skin. They recolour our own panels, dialogs and buttons too. Your themes still override them.
- `tests/smoke-test.js`: paste into DevTools and run `await kdlSmoke({ modules: true, bulk: true, download: 'zip' })` to check pages, module switches, the bulk bar and downloads.

### Changed
- **Viewed posts** are marked when the post page actually opens (also from a new tab), not on any click on the card: ticking a checkbox or pressing a card button no longer dims it. New setting in Modules → Mark viewed posts: dimmed, a "Viewed" tag, or no change.
- The script has its own `@namespace`, so under AdGuard it no longer shares a sandbox with other scripts. Tampermonkey/Violentmonkey may install it as a separate script: export your settings first, then import them into the new copy and remove the old one.

### Fixed
- The sidebar "Settings" link works again after going back with the browser's Back button.

## [1.1.0] - 2026-11-17

Themes and a Modules tab.

### Added
- **Themes tab.** Restyle the site with your own CSS and colour, width, grid and font variables, limited to chosen sites and page types (post, creator, lists…). Edits preview live, themes import and export as files, and later themes win over earlier ones.
- **Layout rules in themes:** hide, move, wrap, retext or restyle page elements declaratively; everything is undone cleanly when the theme is turned off or the page changes.
- **Built-in presets**, all off by default: Dense grid, Clutter off, Compact sticky header, Reader mode, Compact creator header, Dim viewed posts.
- **Theme scripts** for your own themes, local only and behind a separate "Allow theme scripts" switch. Imported themes never carry scripts.
- **Modules tab.** Every feature is listed by group with its description, the pages it runs on, an on/off switch and its own settings, plus search.
- Settings export/import now includes module switches and settings, embed rules, comment layout and debug options; imports check types and skip unknown keys.

### Changed
- Kit styles now win over the site's generic button and card CSS; card checkboxes, comments and translate-button tooltips use the kit.
- The video player follows the kit colours.
- The interface root repairs itself if the site removes it.

## [1.0.0] - 2026-11-17

A new interface and a module system underneath it.

### Added
- **New look throughout**, in the style of shadcn/ui: one dark design system for every button, field, dialog and panel. Floating windows live in their own shadow root, so the site's CSS no longer bleeds into them.
- **One Settings window** with tabs (General, Downloads, Translation, Images, Interface, Modules) replaces the separate Downloader and UI settings. Changes save as you make them; Export, Import and Reset sit at the bottom. The sidebar and header now have a single Settings link.
- **Module system.** Every feature is a module that switches on and off cleanly as you move between pages: downloader buttons, the creator bulk tools, quick favourites, the post page layout, viewed posts, grid size, copy username and the ad blocker. The page type is exposed on the html element (data-kdl-page) for themes.
- The author manager opens as a side panel with search, sort, live loading status and selection kept between openings.
- The bulk download bar, file picker, progress cards and queue share one dock at the bottom of the screen.

### Changed
- Post buttons, card buttons, link buttons (Mega, Gofile and others), comment controls, the image viewer and its translation panel all use the new components. Post info on cards opens on click.
- One session field instead of two (a bare key still works), one debug switch with a verbose option, and one kind of notification.
- The script reads the page's own data under AdGuard too (new unsafeWindow grant), so it can skip an API request.
- Settings kept from earlier versions are moved to the new storage keys once; nothing needs to be set again.

## [0.9.1] - 2026-11-17

### Fixed
- **AdGuard: the script no longer breaks other userscripts, or gets broken by them.** AdGuard joins every enabled userscript into one script. Ours now starts with its own statement boundary, keeps its names off the shared global scope, stops its own start-up errors from aborting the scripts after it, and runs once per page even if injected twice.

## [0.9.0] - 2026-11-17

Stabilisation before the interface rebuild.

### Fixed
- **Pages no longer re-run the script every 300 ms.** On the posts, artists and creators lists, and on creator pages without a card list, the script kept tearing down and rebuilding its buttons, which kept the CPU busy.
- **Downloading selected posts from the author manager works for posts on other pages.** They used to be skipped silently, and so did everything left after navigating during a bulk download.
- **The author manager no longer starts one download per time it was opened**, and its search and sort no longer run several times over.
- **The bulk selection survives page swaps and paging through a creator.**
- The tags.txt and comments.txt options now add those files to archives.
- The Preload gallery images switch now takes effect.
- Archive indexes link the names files were actually stored under, including renamed duplicates and failure notes.
- Two downloads of the same post no longer share one cancel button or remove each other's progress.
- Titles containing `$&` or `$1` no longer garble file names.
- A failed GM_download falls back to a normal browser download instead of losing the file.
- Post info tooltips no longer pile up on cards; styles and settings links are injected once.
- Favourites are fetched once per page load, through the right site's API, and a missing login shows one message instead of many.
- Post metadata and author post lists are no longer cached forever; viewed posts are capped.
- Reopening the image viewer right after closing it no longer picks up the old one.

### Added
- Settings for concurrent files per archive and concurrent queue jobs.

### Changed
- The script is minified: 504 KB down to about 300 KB.
- Removed the Clear Incomplete cache button, which never found anything, and unused code.

## [0.8.53] - 2026-09-29

### Fixed
- **Minimum text size had next to no effect on tall pages.** It is set in on-screen pixels, and the screen width stood in for how wide the picture is shown; a manga page fitted to the screen's height is shown at a fraction of that, so the floor came out several times too small. It is now measured against the picture as the viewer fits it, and the gallery uses the same measure, so both still show one rendering.
- Minimum text size was undone in re-wrapped paragraphs: fitting a tight bubble shrank the text straight past it. The minimum now wins; Keep text out of the next bubble shrinks a paragraph only down to it, and a paragraph still too big spills past its bubble, kept inside the picture.

## [0.8.52] - 2026-09-29

### Added
- **The viewer redraws the translation live** while a display setting moves: drafts during a drag, the sharp picture when you let go. Redraws use the answer Lens already gave; nothing is sent to Google again.
- **Translation carries into the viewer**: a picture translated in the gallery opens translated, and translation stays on while you page through the post. A page with no text on it is shown as is, without an error and without switching translation off.

### Changed
- Settings that shape a paragraph (alignment, line spacing, keeping text out of the next bubble) switch horizontal re-wrapping on, since horizontal text drawn line by line has none of those. The panel is regrouped by what each setting acts on.
- Turning a translation on or off in the viewer is instant: nothing reloads.

### Fixed
- In cover (hull) erasing and in manga mode, horizontal lines had no outline and the outline slider did nothing; at 0 the outline could not be removed.
- Redraws decoded the whole picture and every inpainting patch again, and encoded the result as a PNG, which made each one slow on large pages.

## [0.8.51] - 2026-09-29

### Added
- **Translation display settings inside the image viewer.** The sliders button next to Translate opens every display setting of the Lens engine: manga mode and bubble fill, re-wrapping, line spacing, alignment, vertical text, font, how and how far the original is erased, text outline, minimum size and sharpness. The translation on screen redraws as you change them, from the answer Lens already gave, and so does the gallery preview.

### Changed
- Those settings moved out of the settings modal, which keeps showing the button, remembering answers across reloads and clearing the cache.

### Fixed
- Turning a translation on or off in the viewer reset the zoom and position.

## [0.8.50] - 2026-09-29

### Fixed
- On Pawchive the lightbox, the "download original" buttons and image translation pointed at the main domain, which does not serve files, so the image never loaded (404).
- The lightbox threw errors on scroll, resize and navigation while its image was loading or had failed. It now falls back to the site's own link, and says so when that fails too.

## [0.8.49] - 2026-09-29

Everything since 0.2.1.

### Added
- **Text inside images is translated in place** through Google Lens, from the gallery and the lightbox. Rendered the way Chrome's Lens overlay does it, with a manga mode, two ways of erasing the original text, re-wrapping, line spacing and keeping text inside its bubble. Answers are remembered across reloads by the picture's pixels, and the cache can be cleared in settings. No key needed.
- **Translate buttons on the post title, its content and every comment.** Google and Yandex work without a key; OpenAI-compatible APIs (OpenAI, Gemini, OpenRouter, local servers), native Gemini and DeepL need one.
- **Comments as a list, a grid or a carousel**, with author replies threaded under the comment they answer, cards of one size that expand in place, and a limit with "Show more". The list keeps its own, shorter limit.
- **AdGuard support**, desktop and Android.
- **Cancel** any running download.
- Reading interface: image gallery with a lightbox (zoom, pan, swipe, download the original, Lens search), a Plyr video player, buttons for Mega, Gofile and other link hosts, viewed posts marked, adjustable card grid, and settings reachable from the site's header and sidebar.
- Empty post sections are hidden (on by default).
- Optional built-in ad blocker.
- Ignored file extensions, a picker for attachments across several posts, and a folder picker for bulk download paths.
- Post data read instantly from the page when the site embeds it.

### Changed
- **ZIPs are streamed**, so large archives no longer freeze the page or run out of memory.
- Missing, forbidden and unauthorised files fail at once instead of spending every retry; Pawchive files move to the file host without using a retry.
- Settings modal in three columns, with English tooltips.
- Buttons, colours and icons follow the site's own theme; icons are Lucide instead of emoji.
- The bulk selection bar floats at the bottom; Shift+click selects a range of posts.

### Fixed
- The session cookie was sent to other sites, such as translation APIs and external file hosts.
- The site's own player took over the video, leaving two players on top of each other.
- Mega buttons swallowed the password written right after the link.
- Kemono and Coomer API requests and file links.
- On Pawchive, gallery thumbnails never got their "download original" and Lens search buttons.
- Hiding empty sections could hide comments that exist.
- The same file was downloaded twice when a post listed it both as its file and as an attachment.
- Single files failed to download without saying so.
- Buttons and layout were lost after browser back/forward and HTMX page swaps.
- Author manager thumbnails and Shift+click selection.

## [0.2.1] - 2026-07-30

### Added
- IndexedDB cache for downloaded files and post metadata.
- `fflate` ZIP engine with configurable compression levels.
