# Translations

Anyone can add or fix a translation with a pull request. No keys, no signing.

The script downloads `index.json` and the pack of its language from `main` (raw.githubusercontent.com) at
most once a day, or when "Update translations" is pressed in Settings → General. English is built into the
script (`src/i18n/en/`), and Russian is also bundled as an offline copy.

| File | What |
| --- | --- |
| `<code>.json` | One language: `code`, `name` (native), `version` (integer), `ui`, `site` |
| `index.json` | The list of packs: `[{ "code": "ru", "name": "Русский", "version": 2 }]` |

## Add a language

1. `npm ci`, then `npm run locale-template -- de "Deutsch"`. This writes `locales/de.json` with every
   interface string in English and adds `de` to `index.json`. (Or copy `ru.json`, set `code` and `name`,
   start at `"version": 1` and add the entry to `index.json` yourself.)
2. Translate the values. Leave the keys alone. Anything left empty or untouched shows in English.
3. `npm run check-locales` and fix what it reports.
4. Open a pull request with `locales/de.json` and `locales/index.json`.

## Fix or extend a translation

Edit `locales/<code>.json`, raise its `version` by one **in the pack and in `index.json`** (the script only
takes a pack newer than the one it has), run `npm run check-locales`, open a pull request. When new strings
were added to the script, `npm run locale-template -- <code>` adds the missing keys and keeps your
translations.

## What goes where

- `ui`: the script's own interface. The keys are those of `src/i18n/en/*.ts` plus module texts
  (`mod.<id>.name`, `mod.<id>.description`, `mod.<id>.setting.<key>`, `...option.<value>`,
  `modules.group.<group>`, `settings.tab.<id>`, `themes.preset.<id>.name|description`), see
  `src/i18n/README.md`.
- `site`: the site's own menus, headings and buttons. The key is the English text exactly as the site
  shows it; `{name}` in a key matches any text: `"Showing {from} - {to} of {total}": "Показаны {from}–{to} из {total}"`.

Messages keep the `{placeholders}` of the English text and may use plurals:
`{count, plural, one{# файл} few{# файла} many{# файлов} other{# файла}}` (`#` is the number; the
categories come from your language's plural rules, `other` is required).

## What the check enforces

`npm run check-locales` (CI runs it on every push and pull request) fails when:

- `index.json` is not a list of `{code, name, version}`, or a pack is missing from it (or it lists a missing file);
- a pack is not valid JSON, has a BOM or CRLF line endings, or its `code`/`version` differ from `index.json`;
- a value is not a string;
- a translation has an unclosed `{`, a malformed plural, or a `{placeholder}` the English text does not have.

It warns about untranslated keys, keys the script does not know, and translations that leave out a
placeholder. The script applies the same rules to what it downloads: a pack with a wrong shape is ignored,
broken entries are skipped and show in English.

Files must be UTF-8 without a BOM, with LF line endings (`.gitattributes` enforces LF).
