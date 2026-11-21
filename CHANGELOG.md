# Changelog

User-facing changes to the userscript. Every push to `main` reaches users through auto-update; tagged versions also get a [GitHub Release](https://github.com/bropines/kemono-download-button/releases), whose notes come from this file.

## [Unreleased]

## [2.0.3] - 2026-11-21

### Changed
- The page is revealed once it is actually drawn (two frames after it is set up, instead of one), so the skeleton turns into the page instead of fading to an empty screen first while the page finishes its work.
- The tags page skeleton looks like the tag list: rows with their popularity bars, names and counts, instead of a column of buttons. The Stylus loading style (2.1.0) carries it; the settings offer the update.
- The loading style is offered under AdGuard too (it installs userstyles), not only with Stylus.

### Fixed
- The tags page no longer re-sorts all 2000 tags when the next batch comes into view (about 100 ms each time, including right as the page appeared).

## [2.0.2] - 2026-11-21

### Fixed
- The home page's background no longer grows from a small box to the full screen as the page comes in: blocks holding full-screen elements only fade in. Page transitions no longer zoom at all, and blur less.
- The loading skeleton is never drawn over a page that is already shown (with reduced motion it stayed for a second over the new page).
- With the Stylus loading style, the first load no longer switches from its skeleton to a different one when the script starts.

## [2.0.1] - 2026-11-20

### Fixed
- Links in the blocks the script adds (similar creators, the creator overview, info badges) open the page in place like the site's own links, with the loading skeleton and transition, instead of reloading the whole site.
- The page no longer jumps a moment after it has loaded: it was held at the loading skeleton's height until the transition ended.
- A request that does not change the page (a form, a partial update) no longer leaves the page dimmed for a few seconds.

## [2.0.0] - 2026-11-20

The redesign is now the default look, and pages load without the site's old layout flashing first.

### Added
- Page transitions: the next creator tab or page of posts slides in from its side, a post rises in, going back drops in, and cards cascade in as the loading skeleton dissolves. While the next page loads, the current one dims. Follows the system "reduce motion" setting; Settings → Interface → Page transitions turns it off.
- Loading skeletons: while a page is being set up, a muted, softly shimmering picture of it stands in. Every kind of page has one (creator page and tabs, posts, post lists, popular, tags, creators, favourites, DMs, importer, account and more), for phones and wide screens. They are snapshots of the real pages, and after a page has settled the script keeps a snapshot of how it looks in this browser (grid size, page width, theme, phone layout), so the next visit loads behind an exact picture of it.
- An optional style for Stylus (`extras/kdl-preload.user.css`) that shows the skeleton instead of the site's own layout from the first frame until the script is ready, since userscript managers start scripts late. An installed style older than the script is detected: the settings show "Update the style", and a one-time notice offers the update.
- A welcome screen after install with the redesign switch and the optional loading style; Settings → Interface shows it again. Its "seen" mark is kept by the userscript manager, so clearing site data does not bring it back.

### Changed
- The redesign is now on by default, with its switch at the top of Settings → Interface. Switching it off also turns off what belongs to it: similar creators, the creator overview, info badges, the creator links menu, block ordering, the import status page and page transitions.
- With the redesign on, the page content stays hidden for the moment it takes to rework it, so the site's own layout no longer flashes on load or navigation.
- Similar creators, the creator overview and info badges start loading while the page is still loading, side by side instead of one after another. Similar creators are also cached for 48 hours, like the overview, and show up without waiting for your favourites; the stars are added when those arrive.
- Faster page set-up: smooth thumbnails no longer force a layout per card, and long comment threads no longer force an extra layout of the whole post page.

### Fixed
- Live post search no longer pulls the posts back to their original place, or leaves "Load more" behind, when the creator page blocks were reordered.
- Creator page block ordering no longer moves or hides the creator tabs along with the posts.
- The creator overview no longer asks the API again on every page update for creators with nothing to show.
- Hiding the videos block on a post now also hides the site's own video list.

## [1.10.14] - 2026-11-20

### Fixed
- Close tooltips when their buttons are removed during page navigation.

## [1.10.13] - 2026-11-20

### Changed
- Redesign attachment rows for desktop and mobile, keeping filenames readable and file search compact.

## [1.10.12] - 2026-11-20

### Fixed
- Keep each attachment and its search button aligned on desktop and mobile.

## [1.10.11] - 2026-11-20

### Changed
- Avoid redundant comment layout work when opening and updating a post.

## [1.10.10] - 2026-11-20

### Added
- Hide and restore supported creator and post blocks directly in layout editing mode.
- Reorder creator page blocks, overview sections and post blocks with drag handles or move buttons; the chosen order is remembered.
- Double-tap the left or right side of a video on touchscreens to seek by 10 seconds.
- Add privacy-conscious download diagnostics when debug logging is enabled.

### Changed
- Show page block reorder controls only while layout editing is enabled in Interface settings.
- Apply enabled user themes at document start to reduce flashing on page load.
- Cache public creator overview API responses for up to 48 hours, and clear them with the existing cache control.
- Show related module switches and settings alongside the interface, downloads and themes settings.
- Respect Pawchive's per-tab file request rate and concurrency limits.
- Use compact header icons on phones by default, while preserving explicitly chosen header modes.

### Fixed
- Match attachment and file-search button sizes on desktop and mobile.
- Reduce layout recalculations when rendering long comment threads.
- Reuse bytes from individual downloads for a later ZIP when the userscript fetched the file.
- Retry stalled downloads after the configured inactivity timeout, even when the userscript host does not report a timeout.
- Stop the page scrolling to the gallery automatically when its thumbnails load.
- Keep the downloads indicator and panel in place when the bulk bar is closed or the device is rotated.
- Identify file requests to Pawchive as this downloader, in accordance with the site's policy.
- On AdGuard, offer direct browser links when Pawchive refuses individual file requests with HTTP 403.
- Restore the skin's layout immediately after HTMX saves a history snapshot.
- Expiring post metadata can no longer delete a newer cached response.
- Improve mobile attachment layout and centre header button icons.
- Report failed individual downloads instead of incorrectly saying that all downloads started.
- Show a clearer message when Pawchive refuses file access and improve the mobile downloads panel.
- Creator overview no longer duplicates its tags, announcements or linked accounts when page updates overlap while loading.

## [1.10.0] - 2026-11-19

### Added
- **Creator overview** (module): on a creator's Posts tab, the latest announcement (click to expand), the creator's tags as a chip strip that filters the posts, and linked accounts, read from the API; each part can be switched off.

### Changed
- Creator on other sites: the row under the header became a menu. Clicking the creator's name (or the link icon beside it) opens it: the original profile, known links (Pixiv, E-Hentai), searches for the name on E-Hentai, nhentai, Hitomi, Danbooru, Gelbooru, Rule34, Yande.re, Pixiv and the other archives, and "Suggest a link". The search sites are editable in the module settings ("Label | URL" with {name} or {tag}); Ctrl+click on the name still opens the original site.
- "Find elsewhere" shows its answer inside the button: "Only in this post", or "In N other posts", which opens the site's hash search.
- Similar creators: no "Show all" link (the Similar creators tab is right above).

### Fixed
- Site skin: the page no longer gets wider than the window (content past the right edge, the sidebar overlapping it) when the top bar or a strip of cards is wide.

## [1.9.0] - 2026-11-19

### Added
- **Hidden creators** (module): creators you blocked on Pawchive (the list is read from the Creators page) and creators you hide with the new eye button on a creator page disappear from every list of posts and creators, on all three sites. A chip "N hidden · show" reveals them for the page; dim instead of hide in the module settings. A hidden creator's own page still shows their posts.
- **Download by tags** (module): a Tags button on creator pages opens the creator's tags with post counts; pick some and every post carrying them goes to the bulk download.
- **Download history**: the script remembers downloaded files by content hash. Settings → Downloads → "Skip already downloaded files" leaves them out of downloads and ZIPs; post pages and the file picker mark them "Downloaded", and "Find elsewhere" shows how many other posts hold the same file.
- **Post and creator info** (module): post count (and DMs, shares, chats where the site has them) under a creator's name; "Edited", "Flagged: missing files" and the file count on posts; previous / next buttons where the site has none.
- **Similar creators** (module): a strip of similar creators under the creator header on the Posts tab.
- **Creator links on other sites** (module): an "Also on" row on creator pages with the creator on Pixiv (fanbox ids are Pixiv ids) and E-Hentai from the community dataset github.com/bropines/creator-links, a "Search E-Hentai" link and "Suggest a link", which opens a prefilled GitHub form.
- Post page layout: switches to hide whole blocks of a post (downloads, text, files and gallery, videos, comments, tags).

### Changed
- The "Manage all posts" button is now called "Post manager".

### Fixed
- Site skin: the new Block button on creator pages matches the other header buttons (outline, red tint on hover) and is translated.

## [1.8.1] - 2026-11-17

### Added
- Video player: a loop button next to the settings gear. The choice is remembered across videos and pages; the L key toggles it too.

## [1.8.0] - 2026-11-17

### Changed
- Dropdowns (site skin and the script's own) open as a styled menu: dark card, rounded items, a hover highlight and a checkmark on the chosen one (Chrome 135+; other browsers keep their native list).
- Creator pages: the tabs sit on their own row under the header on every tab, instead of inside the pages bar on Posts only; the header keeps the same width on Linked accounts and Similar creators.
- Login and register pages: a narrow card with spaced fields and a centred call to action.
- File hash search: the file field is a proper drop zone (icon, "drop a file or click", the chosen file's name and size, a highlight while dragging) instead of the browser's own file input with its off-centre "No file chosen".

### Fixed
- Russian translation of the login and register pages, the Fanbox session key tutorial and the Safari, Firefox and Discord steps of the session key tutorial.

## [1.7.1] - 2026-11-17

### Changed
- Tag pages render lazily: the first 300 tags at once, the next 300 as you scroll near the end (search, sort and the letter jump still cover every tag). Opening or closing the sidebar no longer stutters on the 2000-tag page.

### Fixed
- Tag list layout: tags hidden by the filter or the script choice really disappear (they kept their place in the list).

## [1.7.0] - 2026-11-17

### Added
- **Messages as cards** (module, on by default): DM pages show an even grid of cards with the creator's avatar and a preview cut to a few lines (short, medium or long in the module settings). A click on a card, or its Read button, opens the whole message in a side panel (or a dialog) with the creator links, copy text, and previous / next by buttons or the arrow keys.

### Fixed
- Tag list layout: names and counts are centred in their rows, rows and popularity bars are brighter.
- Tag pages open straight in the chosen layout: the list no longer starts as the site's cloud and rearranges after load, and the space for the toolbar is kept from the first paint, so the tags do not jump down.
- Site skin: the pinned top bar no longer shows while the sidebar is open on wide screens (the site hides it then).

## [1.6.0] - 2026-11-17

### Added
- **Downloads panel**: every download is a card with a type icon, an overall progress bar with percent, a file counter and a coloured state (done, partly failed, failed, cancelled). The file list folds away and opens by itself when a file fails, failed files come first. The panel folds into a small button with a progress ring a few seconds after the last download ends; finished downloads stay listed until "Clear finished". Settings → Downloads → Downloads panel: position (any corner or bottom centre), open on start, remove finished automatically.
- **Smooth thumbnails** (module, on by default): card previews are shrunk with high-quality resampling, so line art no longer looks jagged.
- Site skin settings: card thumbnail shape (square, 3:4, 2:3, 4:3, 16:9); pinned top bar; icons on the top bar links, with "icons only" and "text only" modes; centred top bar; sidebar that opens over the page instead of pushing it (starts closed, closes on a click outside or Esc).
- Tag pages: a list layout in columns with the post count on the right and a popularity bar (default), switchable back to the cloud from the toolbar.
- File hash search page as a card: a drop zone for the file, an "or" divider and the hash field.

### Changed
- Pagination bars are one row on wide screens (the "Showing" line beside the pages), so they take less height.
- Settings: the tab row is full width on an opaque backing, so cards scrolling under it no longer show around it.

### Fixed
- Russian translation of the importer page (options, notes, auto-import), the session key tutorial and the hash search page.

## [1.5.0] - 2026-11-17

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
