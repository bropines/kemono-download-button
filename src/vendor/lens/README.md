# Lens core (vendored)

A copy of the core of [chrome-lens-userscript](https://github.com/bropines/chrome-lens-userscript)
(MIT, 2.10.0, with search by image, the text transport and long-strip tiling from 2.14.1), which talks to Google Lens's `crupload` endpoint and renders the
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
path and `store.ts` are untouched; what else changed since is listed in the
sections below):

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

## The request as text, for AdGuard for Android (from upstream 2.14.1)

AdGuard for Android's `GM_xmlhttpRequest` cannot carry a binary body (a typed
array goes out as comma-separated numbers, a binary string is re-encoded and cut
at a NUL) and refuses anything over 64 kB, so every translation there failed
with HTTP 400. Upstream 2.14.1 sends the same request as text; taken from it:

- `lens/wire-text.ts`, verbatim: the objects request as proto3 JSON with the
  picture as base64, sent with `$alt=proto` and
  `X-Goog-Encode-Response-If-Executable: base64` so the usual binary answer comes
  back as base64 text; the picture is re-encoded smaller, quality first and then
  size, until the URL-encoded body is under 60 kB.
- `transport.ts`, verbatim but for one function: the types of 2.14's module
  (`BinaryRequest` with its `text` alternative, `TextAlternative`, `GetOptions`,
  `Transport`). Upstream's `getTransport()` throws until a front end has
  installed a transport; here it falls back to `gmTransport` from `gm.ts`, the
  only one there is, so nothing has to install it.
- `lens/client.ts`, verbatim: `callLens` goes through `getTransport()` and
  passes `text:`; `fetchImageBlob` sends the page as the `Referer`.
- `gm.ts`: the whole `// --- Transport ---` section is 2.14.1's, the rest of the
  file is still 2.10's (storage, commands, diagnostics; no clipboard, no tab
  opener, no GM4 async storage, so `monkey.ts` needs nothing new). What that
  brings: the `text` rung, tried after the typed array and the binary string
  have both come back 400 and then remembered for the session
  (`sendViaGm` / `sendBodyViaGm` / `ladder` / `climb`); `postBinary` sent
  without cookies (`anonymous`); `getBinary` following redirects by hand, since
  AdGuard does not, and saying so when a web page comes back where a picture was
  asked for; `gmTransport`. Tampermonkey and Violentmonkey still take the typed
  array first and never reach the text rung.

One local change in `gm.ts`'s `ladder`, not upstream's: once the text form is
what works, a request that has no text form goes straight to the page `fetch`
rung. Search is such a request: upstream's `lens/search.ts` passes no `text`, and
its messages cannot simply be written as JSON by the names in `gen/fields.ts`
(the service knows the session messages by other names, and the routing info is
an opaque blob). Upstream's ladder would repeat the two refused binary shapes
and then stop, because the latch on the working transport drops the fetch rung.
Whether a page `fetch` gets through depends on the site's CSP; the endpoint
itself answers the CORS preflight.

## Long strips as tiles (from upstream 2.14.1)

The upload budget is an area and a longest side. For a webtoon strip the side
binds: 800x11352 went up as 113x1600 and Lens found nothing in it. Upstream
2.14.1 cuts such a picture along its long axis into overlapping tiles and merges
the answers; taken from it:

- , verbatim (pure arithmetic):  (null for
  anything the long side does not bind, so a page goes up once as before; at most
  12 tiles, a quarter of each shared with its neighbour),  (every
  box moved into the whole picture's coordinates, a paragraph seen by two tiles
  kept once), .
- , verbatim:  replaces  for callers. The
  first tile goes alone, the rest two at a time; a tile that fails in a way that
  could pass () is asked once more, and a tile that still fails
  fails the translation.
- : 2.10's, with  exported and upstream's   added (typed against , which this copy has in place of
  ). Nothing else of 2.14's  was taken.
- :  on . Left out it is
  'auto'; there is no setting for it in this script.
- : 2.10's, with upstream's , which adds an   mark when tiling is off.

The merged answer has the shape of any Lens answer, so  (ours,
see above) draws it unchanged.  calls and, as upstream's  does, files a tiled strip in the persistent store
under its fingerprint plus , so the empty answer a single upload once
got for the same pixels is not what comes back.

## Local files

Two files here are not upstream's:

- `monkey.ts` stands in for `'$'`. The plugin compiles each import into
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
