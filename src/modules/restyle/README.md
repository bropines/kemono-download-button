# Restyle module (`restyle`)

Built-in, Stylus-like theming for Kemono, Coomer and Pawchive. Enabled by default. Themes are edited in
**Settings → Themes**.

| File | Role |
| --- | --- |
| `types.ts` | `Theme`, `Transform`, the site, page and action lists |
| `store.ts` | storage, validation, import/export, change events |
| `scopeCss.ts` | prefixes user CSS with the theme's site/page scope |
| `vars.ts` | site variables and what they map to |
| `transforms.ts` | hide/sticky → CSS; DOM transforms with undo |
| `apply.ts` | `<style id="kdl-theme-<id>">` nodes and local scripts |
| `presets.ts` | built-in themes |
| `../../ui/settings/sections/themes.ts` | the Themes settings tab |

## Storage

Everything goes through `readStored`/`writeStored`, so it is AdGuard-safe.

- `restyle.themes`: the ids of user themes, in order (later ones win).
- `restyle.theme.<id>`: one theme. At most **200 KB** of JSON; a bigger save throws `ThemeError` and the editor shows the error.
- `restyle.builtins`: `{ [presetId]: boolean }`. Presets live in code, so only their on/off state is stored.
- `mod.restyle.allowScripts`: the "Allow theme scripts" switch.

## Theme format

```jsonc
{
  "format": "kdl-theme",
  "version": 1,
  "theme": {                       // or "themes": [ … ] for "Export all"
    "id": "t…",                    // replaced on import
    "name": "Midnight",
    "enabled": true,               // imported themes always start disabled
    "sites": ["pawchive"],         // or "any"; values: kemono, coomer, pawchive
    "pages": ["list", "creator"],  // or "any"; values: post, creator, list, artists, search, other
    "vars": { "--kdl-site-bg": "#0b0d12", "--kdl-site-accent": "#f0a" },
    "css": ".post-card { border-radius: 12px; }",
    "transforms": [{ "selector": ".global-footer", "action": "hide" }]
  }
}
```

Only a theme created in this browser (`origin: "local"`) can have a `script`. Export never includes
`script`, and import strips it.

## How CSS is applied

Each enabled theme gets one `<style id="kdl-theme-<id>">` at the end of `<head>`. The styles are moved
back to the end when another module adds its own style later. Every top-level selector is prefixed with
the theme's scope:

```css
/* sites: ["pawchive"], pages: ["post"] */
.post__title { … }   →  html[data-kdl-site="pawchive"][data-kdl-page="post"] .post__title { … }
:root { --x: 1 }     →  html[data-kdl-site="pawchive"][data-kdl-page="post"] { --x: 1 }
```

Rules inside `@media`, `@supports`, `@container` and `@layer` blocks are scoped too. `@keyframes`,
`@font-face` and `@property` stay global, and `@import` is moved to the top. Because the router only
flips the `<html>` attributes, navigation needs no re-injection.

User CSS is deliberately **not** put in an `@layer`. Unlayered site CSS beats every layered rule, so a
layer would make user rules lose. The prefix instead adds (0,1,1) specificity, and the theme styles come
last, so plain rules beat the site's without `!important`. Use `!important` only against inline styles,
for example the grid size's `--card-size`.

## Variables

Set in the Variables form or under `vars`. A variable is written on the scoped `<html>`. It is mapped
onto the site's own variables, and onto the kit's tokens on `.kdl-scope` and `#kdl-root`, only when the
theme sets it.

| Variable | Site | Kit |
| --- | --- | --- |
| `--kdl-site-bg` | `--colour1-primary` (+ `-transparent`), body background | `--kdl-background`, `--kdl-primary-foreground` |
| `--kdl-site-surface` | `--colour1-secondary` (+ `-transparent`), `.global-sidebar` and top header backgrounds | `--kdl-card`, `--kdl-popover`, `--kdl-secondary`, `--kdl-muted`, `--kdl-accent` |
| `--kdl-site-text` | `--colour0-primary`, body colour | `--kdl-foreground`, `--kdl-*-foreground` |
| `--kdl-site-muted` | `--colour0-secondary` | `--kdl-muted-foreground` |
| `--kdl-site-accent` | `--anchour-colour1-primary`, `--anchour-internal-…`, `--anchour-local-…`, `--submit-colour1-primary`, `--plyr-color-main`, the active tab underline | `--kdl-primary`, `--kdl-ring` |
| `--kdl-radius` | post cards, user header, comments, thumbnails, search input | `--kdl-radius` |
| `--kdl-content-width` | `#main > .site-section` max-width (centred) | |
| `--kdl-grid-gap` | `.card-list__items` gap | |
| `--kdl-font` | body font-family | `--kdl-font` |
| `--kdl-font-size` | body font-size | |

Any other custom property (`--my-thing`) is written as is, so you can use it from your CSS.

## Transforms

`{ selector, action, arg?, pages? }`. `pages` narrows the theme's own page scope.

| Action | `arg` | Effect |
| --- | --- | --- |
| `hide` | | CSS `display: none !important` |
| `sticky` | top offset (`0`, `3rem`; a bare number means px) | CSS `position: sticky` |
| `remove` | | removes the node (a comment marks its place for undo) |
| `addClass` | class names | adds the classes the node does not have yet |
| `setAttr` | `name=value` | sets the attribute. `on*`, `srcdoc`, `formaction` and `javascript:` values are refused |
| `moveBefore` | target selector | moves the node before the first match of the target |
| `moveInto` | target selector | appends the node to the first match of the target |
| `wrap` | class names | wraps the node in `div.kdl-restyle-wrap.<classes>` |
| `setText` | text | replaces the node's content with the text |

DOM transforms run on mount and on every router update. They are idempotent: each touched node is
recorded per rule and marked `data-kdl-restyled`. They are undone, newest first, when the theme turns off
or stops matching the page, when the module unmounts, and before htmx saves a history snapshot. They are
applied again right after the snapshot. Errors, such as an invalid selector or a refused attribute, appear
under the transforms list.

## Scripts (local themes only)

With **Allow theme scripts** on, a local theme's `script` runs as `new Function('kdl', script)(kdl)`,
once per page. `kdl` is `{ page, site, theme, root, onCleanup(fn) }`. Cleanups run when the theme turns
off, the script is edited, or the page stops matching. A strict CSP or AdGuard can block `new Function`;
the failure is logged and nothing else breaks.

```js
const btn = document.createElement('button');
btn.textContent = 'Top';
btn.onclick = () => scrollTo({ top: 0 });
document.body.append(btn);
kdl.onCleanup(() => btn.remove());
```

## Presets

| Preset | Pages | What it changes |
| --- | --- | --- |
| Dense grid | lists | cards at 80% of the grid size, 4px gaps, slim captions clamped to two lines |
| Clutter off | all | hides the footer, announcements, ad containers, the community/promo sidebar block, DM links and the DM tab, and register/login links; on desktop the sidebar becomes a 52px icon rail that opens on hover |
| Compact sticky header | all | a 32px translucent, blurred top bar, sticky (via a `sticky` transform) |
| Reader mode | post | a centred 760px column, 1.15rem/1.75 text, no borders or banner; comments collapse to a faded preview and expand when their heading is clicked (`setAttr tabindex` transforms + `:focus-within`) |
| Compact creator header | creator | banner hidden, a slim row with a round avatar, page tabs as pills |
| Dim viewed posts | lists | `.kui-viewed` cards turn grey at 30% opacity with a "Viewed" tag and light up on hover |

## Examples

Recolour everything:

```json
{ "vars": { "--kdl-site-bg": "#0f1115", "--kdl-site-surface": "#171a21", "--kdl-site-text": "#e6e6e6", "--kdl-site-accent": "#ff7ab6", "--kdl-radius": "10px" } }
```

Move the bottom paginator above the grid and give post titles a pill look:

```json
{
  "pages": ["list", "creator"],
  "transforms": [{ "selector": "#paginator-bottom", "action": "moveBefore", "arg": ".card-list" }],
  "css": ".post-card__header { border-radius: 999px; margin: 4px; }"
}
```
