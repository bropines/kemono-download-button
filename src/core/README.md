# Module system core

Everything the script does on a page is a **module**. `src/index.ts` registers the built-in modules
(`src/modules/index.ts`) and starts the router; the router mounts the modules that match the current page
and site, calls `update` on batched DOM mutations, and unmounts them on navigation.

## Public API (`import … from '../core'`)

### Registry (stable — the settings UI builds on this)

| Function | Purpose |
| --- | --- |
| `registerModule(m: KdlModule)` | Add a module. Mounts it right away if the router is running and it matches. |
| `getModules(): readonly KdlModule[]` | All modules in mount order. Render a Modules tab from `name`, `description`, `group`, `locked`, `settings`. |
| `getModule(id)` | One module definition. |
| `isModuleEnabled(id)` / `setModuleEnabled(id, on)` | The user's switch (`mod.<id>.enabled`, default `defaultEnabled`). Changing it mounts/unmounts immediately and adds/removes its styles. `locked` modules ignore it. |
| `isModuleMounted(id)` | Whether it is active on the current page. |
| `getModuleSetting(id, key)` / `setModuleSetting(id, key, value)` | Declared settings, stored under `mod.<id>.<key>`, coerced by their `SettingDef` (number clamped to `min`/`max`). `set` notifies the module's `onChange` listeners. |
| `onRegistryChange(fn)` | Events `registered`, `enabled`, `disabled`, `mounted`, `unmounted`, `setting`. Returns an unsubscribe. |

Storage goes through `readStored`/`writeStored`, so it is AdGuard-safe.

### Router / page

- `startRouter()`: detect the page, mount, install hooks. Called once by `index.ts`.
- `onPageChange(fn)`: after every pathname change (before modules mount).
- `getCurrentPage(): PageInfo`, `detectPage()`, `detectSite()`.
- `<html data-kdl-page="post|creator|list|artists|search|other" data-kdl-site="kemono|coomer|pawchive">` for CSS.
- Our `<head>` styles carry `data-keep` (`keepInHead` / `keepOwnHeadNodes`): Pawchive removes every unmarked head `<style>` on `htmx:beforeSwap`.

## Writing a module

```ts
export const myModule: KdlModule = {
  id: 'my.feature',            // storage keys: mod.my.feature.*
  name: 'My feature',
  group: 'Lists',
  pages: ['list', 'search'],   // or 'any'
  sites: ['kemono'],           // optional
  defaultEnabled: true,
  settings: [{ key: 'size', label: 'Size', type: 'number', default: 3, min: 1, max: 9 }],
  styles: '.kdl-my-thing { … }', // <style id="kdl-mod-my-feature"> while enabled
  requires: ['core'], after: ['kui.post'],
  setup(ctx) {},               // once, before the first mount; listeners added here are permanent
  mount(ctx) { ctx.onCleanup(() => {}); ctx.settings.onChange('size', (v) => {}); },
  update(ctx) {},              // idempotent: inject only into nodes not handled yet
  unmount(ctx) {},             // undo DOM changes (also used for a runtime disable)
  beforeSnapshot() {}          // strip nodes before htmx stores a history snapshot
};
```

Then add it to `BUILTIN_MODULES` in `src/modules/index.ts`.

Rules:
- `update` runs often. Mark handled nodes (`data-kdl-processed`) instead of deleting and recreating.
- Give your nodes a `kdl-`/`kui-` id or class: mutations made only of those never wake the router.
- Floating UI goes on `document.body`, outside `#main`.

## Lifecycle

- **Pathname change** (pushState/replaceState, popstate, htmx swap): every module whose `pages` is not
  `'any'` is unmounted — before the old DOM goes away when the destination is known (htmx `beforeSwap`
  with a page-level target, patched `pushState`) — then the page is re-detected and matching modules mount.
  `'any'` modules stay mounted and get `update`.
- **Same pathname** (query/hash change, pagination, partial swap): nothing is unmounted; matching changes
  are synced and mounted modules get `update`. A creator's selection survives pagination this way.
- **`htmx:beforeHistorySave`**: `beforeSnapshot` on mounted modules.
- **Mutations**: one `MutationObserver` on `<body>`; only non-own changes inside the root (`#main`, else
  `<body>`) or top-level body changes count. Batched (120 ms debounce, 600 ms max wait, then rAF).
- Page type comes from the URL; when the URL says `other`, the DOM is consulted, again on later mutations
  (kemono.cr renders late).

## Built-in modules

| id | pages | notes |
| --- | --- | --- |
| `core` | any | locked: global styles, settings panels/links, fixed controls, lightbox, debug overlay, menu commands |
| `adblock` | any | ad-slot CSS + pawchive popunder marker |
| `gridSize` | any | setting `size` (120–400), bound to the UI panel slider |
| `viewedPosts` | any | marks opened post cards |
| `copyUsername` | creator | copy button next to the creator name |
| `kui.post` | post | gallery/video/embeds/comments/translation; settings `preloadImages`, `hideEmptySections` (mirrored in `kuiState`) |
| `downloader.post` | post | post action buttons + post data prefetch |
| `downloader.creator` | creator | card buttons, checkboxes, bulk panel, author manager, shift/ctrl-click selection |
| `downloader.list` | list, search | the same card buttons on post lists (no checkboxes); the creator name is fetched from the profile API on the first download |
| `favorites.quick` | list, search, artists | quick favourite stars |
| `ui.shadcn` | any | off by default: shadcn/ui-style skin of the site (`src/modules/shadcnSite/`); settings `accent`, `accentCustom`, `base`, `surfaces`; sets `<html data-kdl-ui~="shadcn">` |
| `ui.shadcn.cards` / `.post` / `.creator` / `.pages` | any | parts of the skin, `requires: ["ui.shadcn"]`; `.pages` also wraps importer notes in panels and turns the FAQ into an accordion (reversible, stripped before snapshots) |

## Storage migration

`migrateLegacyKeys()` runs once (flag `mod.migrated.v1`) before any module value is read and copies:
`kui_hide_ads` → `mod.adblock.enabled`, `kemono_grid_size` → `mod.gridSize.size`,
`kui_preload_images` → `mod.kui.post.preloadImages`, `kui_hide_empty_sections` → `mod.kui.post.hideEmptySections`.
A new key that already has a value is never overwritten; old keys are left in place.
