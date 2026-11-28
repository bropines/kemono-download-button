# Lens core (vendored)

A copy of the core of [chrome-lens-userscript](https://github.com/bropines/chrome-lens-userscript)
(MIT, 2.10.0, with search by image from 2.14.1), which talks to Google Lens's `crupload` endpoint and renders the
translation the way Chromium's own Lens overlay does.

Copied verbatim except for two mechanical changes: `gm.ts` imports from
`./monkey` instead of `vite-plugin-monkey`'s `'$'`, and `.js` extensions are
stripped from relative imports.

Four local changes to `render/canvas.ts`, worth taking upstream:

- `renderToCanvas` is split out of `renderToBlob`, so the image viewer can draw the
  rendering directly and redraw it live while a setting moves: the PNG encode and
  decode were most of what a redraw cost.
- Inpainting patches are decoded once per answer (`decodePatch`) instead of on
  every redraw.
- The per-line outline follows `drawBackground` rather than the patch. Keyed on the
  patch, hull erasing (and so manga mode) drew horizontal lines with no outline,
  and a floor of 1px meant an outline scale of 0 could not remove it.
- In a re-wrapped paragraph the readable-size floor wins over the room: fitting
  the width and Keep text out of the next bubble shrink only down to it, and a
  paragraph still too big spills past its room, kept inside the picture.
  Upstream lets the room win, so on a tight bubble the minimum did nothing.

## Search by image (from upstream 2.14.1)

Search by image and AI Mode came later than 2.10, so the pieces they need were
taken from upstream 2.14.1 on their own, the rest staying at 2.10 (the render
path, `gm.ts`, `image.ts`, `cache.ts`, `store.ts` and `lens/client.ts` are
untouched):

- `lens/search.ts`, verbatim: `ImageSearch` (open a session at `/v1/gsessionid`,
  upload the picture into it, describe the selection in an interaction request,
  mint the `google.com/search` address from `gsessionid` + `vsrid`),
  `buildSearchUrl` and `textSearchUrl`. Only whole-image search is used here;
  regions and objects are in the file but have no UI.
- `gen/fields.ts`, verbatim: additive over 2.10 (cluster info, interaction
  request, `ImageCrop`, `ZoomedCrop`, `OverlayObject`, `TextQuery`, `ClientImage`).
- `protobuf.ts`, verbatim: `writer().float()` for the selection box, a varint
  writer that terminates on negative numbers, and length checks in `decode`.
- `lens/request.ts`, verbatim: the same request as 2.10, with
  `writeClientContext`, `writeImageData`, `randomUuid` and the enum constants
  exported for `search.ts`.
- `lens/response.ts`: 2.10's, with `parseGeometry` exported.
- `types.ts`: 2.10's, plus upstream's `NormalizedBox` and `DetectedObject`, and
  `LensOptions` as an alias of `Settings` (upstream split `Settings` in three;
  this copy has not).

Upstream's own notes on the protocol are in its `docs/lens-capabilities.md`.
The results page is only ever opened in the user's browser, never fetched.

## Local files

Three files here are not upstream's:

- `transport.ts` stands in for upstream 2.14's module of that name, which
  `lens/search.ts` imports. Upstream has the front end install a transport;
  here it is fixed to 2.10's `postBinary` from `gm.ts`, so a search goes out
  exactly as a translation does (same hosts, same retries, no cookies).

- `monkey.ts` stands in for `' The plugin compiles each import into
  `typeof X != 'undefined' ? X : void 0`, so a host without a function (AdGuard
  has no `GM_registerMenuCommand`) leaves it undefined for `gm.ts` to detect,
  where a bare global would throw as the bundle loads.
- `detect.ts` holds only upstream's `Target` types. `image.ts` needs the type;
  the rest of that module finds pictures on a page and pulls in upstream's UI.

Not copied: `main.ts`, `settings.ts`, `languages.ts`, `diagnose.ts`, `ui/`,
`render/cover.ts` and `render/overlay.ts`. Buttons, settings and placement are
ours (`src/services/lensImages.ts` and its callers); `renderToBlob` returns the
whole translated image, so the upstream DOM overlay is not needed.

Do not edit these files. Re-copy them from upstream and redo the changes above;
upstream `AGENTS.md` records why the protobuf codec is hand-rolled, why field
numbers are generated, how `gm.ts` copes with each userscript host, and which
rendering rules must not be "simplified".
`. The plugin compiles each import into
  `typeof X != 'undefined' ? X : void 0`, so a host without a function (AdGuard
  has no `GM_registerMenuCommand`) leaves it undefined for `gm.ts` to detect,
  where a bare global would throw as the bundle loads.
- `detect.ts` holds only upstream's `Target` types. `image.ts` needs the type;
  the rest of that module finds pictures on a page and pulls in upstream's UI.

Not copied: `main.ts`, `settings.ts`, `languages.ts`, `diagnose.ts`, `ui/`,
`render/cover.ts` and `render/overlay.ts`. Buttons, settings and placement are
ours (`src/services/lensImages.ts` and its callers); `renderToBlob` returns the
whole translated image, so the upstream DOM overlay is not needed.

Do not edit these files. Re-copy them from upstream and redo the changes above;
upstream `AGENTS.md` records why the protobuf codec is hand-rolled, why field
numbers are generated, how `gm.ts` copes with each userscript host, and which
rendering rules must not be "simplified".
