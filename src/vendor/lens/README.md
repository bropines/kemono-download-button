# Lens core (vendored)

A copy of the core of [chrome-lens-userscript](https://github.com/bropines/chrome-lens-userscript)
(MIT), which talks to Google Lens's `crupload` endpoint and renders the
translation the way Chromium's own Lens overlay does.

Copied verbatim except for two mechanical changes: the `vite-plugin-monkey`
`'$'` import of `GM_xmlhttpRequest` is dropped (it is a global here), and `.js`
extensions are stripped from relative imports.

Not copied: `main.ts`, `settings.ts`, `languages.ts`, `ui/`, `render/cover.ts`
and `render/overlay.ts`. Buttons, settings and placement are ours
(`src/services/lensImages.ts` and the callers there); `renderToBlob` returns the
whole translated image, so the upstream DOM overlay is not needed.

Do not edit these files. Re-copy them from upstream and redo the two changes
above; upstream `AGENTS.md` records why the protobuf codec is hand-rolled, why
field numbers are generated, and which rendering rules must not be "simplified".
