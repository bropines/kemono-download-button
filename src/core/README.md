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
- **htmx timing**: the events of one swap are gathered for 50 ms, but `htmx:afterSettle` (the last one) and
  `htmx:historyRestore` reconcile at once: every millisecond until then the new page is hidden. As soon as the
  address names the next page (patched `pushState`, `popstate`) the `early()` hooks of the modules that will mount
  there run (`bootEarlyFor`), like at document start: first-frame attributes are set, requests are on their way.
- **Back/forward**: htmx restores the page and its scroll position from its cache before the modules have
  reworked it; the router puts the position right again after mounting and at the reveal
  (`getRestoreScroll()` tells a module that a restore to that position is being set up: the tag list then draws
  the rows it had; `setRestoreScroll(y)` corrects it when a module put back more than htmx kept, as the infinite
  scroll does with its appended pages). On a cache miss (`htmx:historyCacheMiss`) nothing is mounted until the server's answer is in.
- **Mutations**: one `MutationObserver` on `<body>`; only non-own changes inside the root (`#main`, else
  `<body>`) or top-level body changes count. Batched (120 ms debounce, 600 ms max wait, then rAF).
- Page type comes from the URL; when the URL says `other`, the DOM is consulted, again on later mutations
  (kemono.cr renders late).
- **Page cloak** (`cloak.ts`, redesign on; with it off only on the pages our modules still rework in the flow, creator/post/tag pages (`cloaksWithoutRedesign`), and without a skeleton): the children of `#main` are hidden (opacity) from document
  start, and from each page-level htmx swap or history restore, until the router has mounted and updated
  the modules; revealed right before the next paint. A module may `holdCloak(promise)` from `mount` (similar
  creators, the creator overview, post info) so cached data lands in the first frame; holds delay the reveal
  by at most 150 ms, and a 2.5 s failsafe always reveals. `<html data-kdl-ready>` is set at the first reveal.
  On a first load the failsafe first asks `index.ts` (`setCloakFailsafeGuard`): when the modules have not started
  yet, a parsed document is set up right then (not waiting for the site's deferred scripts), and one that is
  still coming in keeps its skeleton, for 10 s at most. `onBeforeReveal` runs one frame before the reveal: read
  styles there, not in `onReveal` (a style read between the reveal's attribute changes restyles the page twice).
- **Loading skeleton**: a picture of the page coming in, drawn on `#main::before/::after` while cloaked and
  `<html data-kdl-skeleton>` is set: at once on a first load, but only after 140 ms for a page htmx swapped in
  (it is in the DOM already and shown a few frames later; a skeleton in between would be a flash). It is a
  snapshot of the real page (`skeletonCapture.ts`: boxes, controls, images and text lines of the first ~1.5
  screens, every x/width a `calc()` of the container, the card grid one repeated tile) rendered by
  `skeleton.ts`. `skeletonStore.ts` picks the user's own snapshot for the route and screen class (taken in
  this browser after each page settles, kept in GM storage when it changed), else the built-in one
  (`skeletons.json`), else the creator page / post list. Built-ins are re-taken with `scripts/skeletons.mjs`
  (see its header) when the redesign's layout changes; `npm run build` then regenerates the optional Stylus
  userstyle (`extras/kdl-preload.user.css`), which shows the same skeletons from the first frame, one URL
  section per route and a media query per screen class.
- **Document-start prefetch**: modules whose data the URL already names start their requests in `early()`
  (similar creators, the creator overview, the creator profile / post data for info badges). The fetchers
  share in-flight requests, so `mount` picks up the same promise.

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
| `tags.tools` | list, creator | tag pages only (`section#tag-container`): filter, sort, A–Z groups with a jump bar, script filter; settings `sort`, `group` |
| `ui.pageTransitions` | any | the page leans away while the next loads and the new one slides in (opacity and transform only, so it stays on the compositor); the first 12 cards cascade; requires `ui.shadcn` |
| `nav.prefetch` | any | htmx sites only: the next page is requested when a link is pressed (setting `hover`: when the pointer rests on it) and handed to htmx's own request in `htmx:beforeSend`; falls back to the real request on any doubt |
| `posts.search` | creator, list | live results for the site's post search box (creator page, `/posts`), Load more, Esc/Clear; setting `delay` |
| `lists.infiniteScroll` | list, creator, artists, search, other | off by default: appends the next pages of paginated card lists (fetched HTML, site markup) near the end of the list, "Load more" fallback and cap (settings `auto`, `maxCards`); URL stays on the first page, appended cards are stripped before snapshots and put back with the scroll position on Back |
| `ui.shadcn` | any | the redesign, on by default (switch at the top of Settings → Interface): shadcn/ui-style skin of the site (`src/modules/shadcnSite/`); settings `accent`, `accentCustom`, `base`, `surfaces`; sets `<html data-kdl-ui~="shadcn">`. `creators.similar`, `creators.overview`, `creators.xlinks`, `info.badges`, `importer.status` and `post.blockOrder` require it, `creator.blockOrder` requires `ui.shadcn.creator`, so switching it off turns them off too |
| `ui.shadcn.cards` / `.post` / `.creator` / `.pages` | any | parts of the skin, `requires: ["ui.shadcn"]`; `.pages` also wraps importer notes in panels and turns the FAQ into an accordion (reversible, stripped before snapshots) |
| `i18n.site` | any | translates the site chrome with the active language's `site` dictionary (`src/i18n/site.ts`); restores originals on disable and before htmx snapshots |

## Storage migration

`migrateLegacyKeys()` runs once (flag `mod.migrated.v1`) before any module value is read and copies:
`kui_hide_ads` → `mod.adblock.enabled`, `kemono_grid_size` → `mod.gridSize.size`,
`kui_preload_images` → `mod.kui.post.preloadImages`, `kui_hide_empty_sections` → `mod.kui.post.hideEmptySections`.
A new key that already has a value is never overwritten; old keys are left in place.
