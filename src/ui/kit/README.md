# UI kit (`src/ui/kit`)

A small shadcn/ui look-alike in vanilla TypeScript: zinc dark theme by default, light optional.
Each primitive is a function that returns an `HTMLElement` (built with `el()`), with its CSS in a
sibling `*.styles.ts` written with `css()`. `kitStyles` joins all of it.

## Two places to render

**Overlays (dialog, sheet, popover, tooltip, toast)** live in one open shadow root on
`<div id="kdl-root">`, a child of `document.body`, so HTMX swaps of `#main` never remove them and
site CSS never reaches them. They portal themselves; you only call `open()`.

```ts
import { dialog, button, toast } from '../kit';
const d = dialog({ title: 'Settings', content: () => [/* nodes */], footer: [button({ label: 'Save', onClick: save })] });
d.open();
toast({ title: 'Saved', variant: 'success' });
```

For a custom floating panel, use `portal(node)` (or `getKitRoot()`) and a z-index from `LAYERS`.
A screen with its own CSS adds it with `addKitStyles(id, css)` (idempotent, returns the root). If the
page removes `#kdl-root`, the next `getKitRoot()` puts it back with those styles and the theme.

**Inline widgets in the page** (buttons on post cards, panels inside `#main`) stay in the light DOM.
Call `ensureKit()` once at startup: it injects `<style id="kdl-kit-styles">` into `<head>` and creates
the root. Wrap the widget in `.kdl-scope`, which carries the tokens and the reset:

```ts
ensureKit();
container.append(kitScope([button({ label: 'Download', icon: 'download' })]));
```

A widget can also be its own scope (`className: 'kdl-scope ...'`). Kit classes outside any scope are not styled.

In the light DOM the kit sheet is a rewritten copy (`lightDomKitStyles`): every `.kdl-ui-*` rule also
requires `:is(.kdl-scope, .kdl-scope *)`, which makes it two classes strong. That beats the site's
`button {}` / `.post-card button {}` rules without `!important`. The sheet is first in `<head>`, so a
call-site override needs two classes too (`.post-card-download-controls .kdl-ui-btn--size-icon`).

`.kdl-tokens` carries only the variables (no reset), for markup the kit must not reset: Plyr's player
(`kuiPlyr.styles` maps `--plyr-*` to kit tokens) and the site's comment cards.

## Theme

Tokens are `--kdl-*` CSS variables (`--kdl-background`, `--kdl-primary`, `--kdl-radius`, `--kdl-font`...).
Dark applies on `:host` and `.kdl-scope`. Light: `setKitTheme('light')` for the shadow root, or
`data-theme="light"` (or `.kdl-theme-light`) on a `.kdl-scope`. Style new code with `var(--kdl-*)`, not hex values.

## Conventions

- Class names are `kdl-ui-<block>`, `kdl-ui-<block>__<part>`, `kdl-ui-<block>--<modifier>`. The existing
  `kdl-*` classes belong to the legacy UI; do not reuse them for kit markup.
- Every primitive takes `className`, which is appended to its own classes.
- Stateful controls return the native element and come with a setter instead of a wrapper object:
  `setButtonLoading`, `setSwitch` / `isSwitchOn`, `setSliderValue`, `setProgress`, `setFieldError`, `setTooltip`.
- `button({ href, target, download })` renders an `<a>` with the button look; `icon` also takes a ready SVG.
- Overlays return a handle: `{ open, close, isOpen, element }` (+ `body`, `footer` for dialog/sheet,
  `toggle` for popover, `update`/`dismiss` for toast).
- `Content` can be a factory (`() => nodes`); tabs, dialogs and popovers call it lazily on first show.
- Escape and outside clicks go through `dismissable()`, which keeps a stack: only the topmost layer
  closes. Mark an element with `data-kdl-dismiss-ignore` to make clicks on it not count as "outside".
- New primitive: add `primitives/foo.ts` + `foo.styles.ts`, register the styles in `styles.ts`,
  export from `index.ts`, and show it in `demo.ts`.

## Do / don't

- Do give icon-only buttons an `ariaLabel` and pair controls with `field()` for label, description and error.
- Do use the Lucide `IconName`s from `config/icons.ts`. Add new icons there.
- Don't attach overlays inside `#main` or put inline widgets in the shadow root.
- Don't use `innerHTML` with site data. Pass text through options, which set `textContent`.
- Don't add global selectors (`button {}`) to kit styles. Everything is class-scoped or under `:host` / `.kdl-scope`.
- Don't add React/Preact or a CSS framework. Keep each primitive small.

`openKitDemo()` in `demo.ts` opens a dialog with every primitive, to check visuals while migrating screens.
