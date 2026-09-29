# Lens core (vendored)

A copy of the core of [chrome-lens-userscript](https://github.com/bropines/chrome-lens-userscript)
(MIT, 2.10.0), which talks to Google Lens's `crupload` endpoint and renders the
translation the way Chromium's own Lens overlay does.

Copied verbatim except for two mechanical changes: `gm.ts` imports from
`./monkey` instead of `vite-plugin-monkey`'s `'$'`, and `.js` extensions are
stripped from relative imports.

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
