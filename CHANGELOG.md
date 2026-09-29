# Changelog

User-facing changes to the userscript. Every push to `main` reaches users through auto-update; tagged versions also get a [GitHub Release](https://github.com/bropines/kemono-download-button/releases), whose notes come from this file.

## [Unreleased]

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
