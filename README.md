# Kemono & Pawchive Download Button

[![Version](https://img.shields.io/github/package-json/v/bropines/kemono-download-button?label=version)](https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js)
[![CI](https://github.com/bropines/kemono-download-button/actions/workflows/ci.yml/badge.svg)](https://github.com/bropines/kemono-download-button/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A userscript for **Kemono**, **Coomer** and **Pawchive**: download posts, files and whole creators in one click, read posts in a cleaner interface, and translate titles, text, comments and even the text inside images.

## Install

**[Install / update the userscript](https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js)**

The link is permanent: your userscript manager checks it for updates on its own. What changed in each version is in [CHANGELOG.md](CHANGELOG.md).

| Manager | Status |
| :--- | :--- |
| Tampermonkey | Reference host |
| Violentmonkey | Supported |
| AdGuard (desktop and Android) | Supported. It has no userscript menu, so open settings with the **Downloader Settings** and **UI Settings** buttons in the site's header or sidebar |

Greasemonkey 4 is not supported: it only offers the `GM.*` API.

## Supported sites

| Service | Domains |
| :--- | :--- |
| Kemono | `kemono.su`, `kemono.cr` and their subdomains |
| Coomer | `coomer.su`, `coomer.party` and their subdomains |
| Pawchive | `pawchive.pw`, `pawchive.st` and their subdomains |

## Features

### Downloading
- **Post buttons**: the whole post as a ZIP, images only, attachments only, links copied in aria2/IDM format, links saved as a text file, or shared.
- **Streaming ZIPs** built with `fflate`, so large archives do not freeze the page. Compression level is configurable; the archive can include `metadata.json`, the post text, tags, comments and an HTML index.
- **Pick files** before downloading, and skip extensions you never want.
- **Bulk downloads** from a creator's page: tick posts (or Ctrl+click and Shift+click cards) and get one archive or one per post. The author manager downloads every post a creator has.
- **Reliable fetching**: configurable retries, cancel any task, automatic fallback to the file host, and an IndexedDB cache of files and post metadata.
- **File name templates** with `{author_name}`, `{post_date}`, `{post_title}`, `{post_id}`, `{user_id}`, `{service}`, `{file_index}`, `{global_file_index}`, `{file_name}`, `{original_file_name}`, `{file_ext}`.

### Reading
- **Image gallery** with thumbnails and a lightbox (zoom, pan, swipe, download the original, search with Google Lens).
- **Video player** built on Plyr, replacing the site's own player.
- **Link buttons** for Mega, Gofile and other hosts, with passwords recognised even when glued to the link.
- **Comments** as a list, a grid of equal cards or a carousel; author replies threaded under the comment they answer; long comments expand in place.
- Empty sections hidden, viewed posts marked, adjustable card grid, and an optional built-in ad blocker.

### Translation
- **Text**: the post title, its content and every comment get their own translate button. Google and Yandex work without a key; OpenAI-compatible APIs (OpenAI, Gemini, OpenRouter, local servers), native Gemini and DeepL need one.
- **Text inside images** through Google Lens, rendered in place the way Chrome's Lens overlay does it: manga mode, two ways of erasing the original, line spacing, re-wrapping, and answers remembered across reloads. No key needed.

## Development

Requires Node.js 22 or newer.

```bash
git clone https://github.com/bropines/kemono-download-button.git
cd kemono-download-button
npm ci
npm run typecheck
npm run build
```

`npm run build` bundles `src/` with Vite and writes the single file `kemono-download-button.user.js`, with the metadata header taken from `src/index.ts`.

```
src/
  api/          site REST clients (Kemono/Coomer, Pawchive)
  config/       constants, selectors, icons, default settings
  features/     reading UI: gallery, video, comments, translation buttons, ad blocker
  services/     downloads, ZIP, cache, queue, translators, Lens image translation
  state/        settings and GM storage
  styles/       CSS written as TypeScript modules
  ui/           settings modal, file picker, bulk panel, author manager
  vendor/lens/  copy of the Lens engine; read its README before editing
```

### Releasing

Every push to `main` reaches users through the auto-update link, so the committed script must always be a build of the committed sources. CI checks that, and that the versions agree.

1. Bump the patch version in `package.json` and the `@version` line in `src/index.ts`.
2. Note user-facing changes in `CHANGELOG.md` under `## [Unreleased]`.
3. `npm run build` and commit the rebuilt `kemono-download-button.user.js` together with the sources.
4. Push to `main`. For a GitHub Release, rename `[Unreleased]` to the version and date, commit, then push a tag: `git tag v0.8.50 && git push origin v0.8.50`. The release notes are that section of `CHANGELOG.md`, and the release fails if it is missing.

## Credits

- Original script by hoami_523.
- Image translation: the engine of [chrome-lens-userscript](https://github.com/bropines/chrome-lens-userscript) (MIT).
- [Plyr](https://plyr.io) (MIT), [fflate](https://github.com/101arrowz/fflate) (MIT), [Lucide](https://lucide.dev) icons (ISC).

## License

MIT License. Free for personal and non-commercial use.
