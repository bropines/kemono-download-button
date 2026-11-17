# Localization (`src/i18n`)

Two dictionaries per language:

- **`ui`**: our interface (settings, dock bar, downloader, lightbox...). Keys live in code; the English
  text in `src/i18n/en/*.ts` is the source of truth and the fallback for every missing translation.
- **`site`**: the site's own chrome (sidebar, headings, buttons, pagination). Keys are the English text as
  the site shows it. Applied by the `i18n.site` module (`./site.ts`).

Translations live in `locales/<code>.json` (see `locales/README.md`); Russian is also bundled into the
script so it works offline. Downloaded packs are validated (`./validate.ts`, `./packs.ts`: shape, string
values, known keys, placeholders matching the English text) and cached in storage. CI runs the same checks
(`npm run check-locales`), so anyone can contribute a translation by pull request.

## Adding a UI string

1. Add the key with its English text to the area file in `src/i18n/en/` (`common`, `settings`, `downloader`,
   `kui`, `modules`). Keys are dotted and namespaced by area: `settings.general.session.label`,
   `dl.bulk.start`, `kui.lightbox.close`. Keep a key unique across files.
2. Use it: `import { t } from '../i18n'` then `t('dl.bulk.start')` or `t('dl.toast.done', { count: 3 })`.
   Keys are typed (`UiKey`), so a typo fails `tsc`.
3. Add the translation under `ui` in `locales/ru.json` (and other packs), bump the pack's `version` (in the pack and in `locales/index.json`),
   then `npm run check-locales`.

Call `t()` when the text is rendered, not at import time, so a language switch picks it up.
Strings in module definitions are read through convention keys instead (no `t()` in the definition):

| Shown text | Key | Fallback |
| --- | --- | --- |
| module name | `mod.<id>.name` | `KdlModule.name` |
| module description | `mod.<id>.description` | `KdlModule.description` |
| module group | `modules.group.<group>` | `KdlModule.group` |
| setting label | `mod.<id>.setting.<key>` | `SettingDef.label` |
| setting hint | `mod.<id>.setting.<key>.hint` | `SettingDef.hint` |
| setting option | `mod.<id>.setting.<key>.option.<value>` | option `label` |
| settings tab title | `settings.tab.<sectionId>` | `SettingsSection.title` |
| built-in theme preset | `themes.preset.<id>.name` / `.description` | `Theme.name` / `.description` |

So a new module is translated by adding those keys to `locales/<code>.json` only; `tx(key, fallback)`
does the lookup.

## Message format (ICU-lite, `./format.ts`)

- `{name}` is replaced by `params.name`.
- `{count, plural, one{# файл} few{# файла} many{# файлов} other{# файла}}`: category from
  `Intl.PluralRules` of the active language, `#` is the number, `=0{...}` exact matches win.
- English needs only `one` and `other`; Russian uses `one`, `few`, `many`, `other`.

## Site strings

`locales/<code>.json` → `site`: `"Favorites": "Избранное"`. A key with `{name}` parts is a pattern:
`"Showing {from} - {to} of {total}": "Показаны {from}–{to} из {total}"`; a part used in a plural
(`{total, plural, ...}`) is read as a number. Matching ignores surrounding and repeated whitespace.

Only nodes inside the chrome selectors listed in `SITE_SCOPES` (`./site.ts`) are touched, and the
selectors in `SITE_SKIP` (post content, comments, names, tags) are never translated. Originals are kept
and restored on disable and before htmx stores a history snapshot.
