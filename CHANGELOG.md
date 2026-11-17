# Changelog

User-facing changes to the userscript. Every push to `main` reaches users through auto-update; tagged versions also get a [GitHub Release](https://github.com/bropines/kemono-download-button/releases), whose notes come from this file.

## [Unreleased]

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
