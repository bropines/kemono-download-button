# Translations

The script downloads these files from `main` (raw.githubusercontent.com) at most once a day, or when
"Update translations" is pressed in Settings → General, and uses a pack only after verifying it.
English is built into the script (`src/i18n/en/`) and Russian is bundled as an offline fallback.

| File | What |
| --- | --- |
| `<code>.json` | One language: `code`, `name` (native), `version` (integer), `ui`, `site` |
| `<code>.json.sig` | Base64 ECDSA P-256 / SHA-256 signature (raw r‖s) over the exact bytes of the json |
| `index.json` | `{ "packs": [{ "code", "name", "version", "sha256" }] }`, generated |
| `index.json.sig` | Signature of `index.json` |

The client accepts a pack only if `index.json.sig` verifies, the pack's SHA-256 equals its index entry,
the pack's own signature verifies and its `code`/`version` match the entry. Otherwise it keeps the cached
or bundled pack. The public key is in `src/i18n/publicKey.ts`; CI runs `npm run verify-locales` with it.

## Pack format

```json
{
  "code": "ru",
  "name": "Русский",
  "version": 3,
  "ui": { "dl.post.downloadZip": "Скачать (ZIP)" },
  "site": { "Favorites": "Избранное", "Showing {from} - {to} of {total}": "Показаны {from}–{to} из {total}" }
}
```

- `ui`: keys from `src/i18n/en/*.ts` plus the convention keys for modules (`mod.<id>.name`, ...), see
  `src/i18n/README.md`. Messages use `{name}` and `{count, plural, one{...} few{...} many{...} other{...}}`.
  A missing key shows the English text.
- `site`: English text exactly as the site shows it → translation. `{name}` in a key matches any text.

Files must be UTF-8 without a BOM, with LF line endings (`.gitattributes` enforces LF).

## Add or change a translation

1. Edit `locales/<code>.json` (for a new language copy `ru.json`, set `code` and `name`, start at `"version": 1`).
2. Raise `version`: clients only take a pack newer than the one they have.
3. `npm run sign-locales` signs every pack and rewrites `index.json` and the `.sig` files.
   It needs the private key: `KDL_LOCALE_KEY` (PEM text) or `.keys/locale-signing.pem` (gitignored, never commit it).
4. `npm run verify-locales` (CI runs it too), then commit the json and `.sig` files.

A new language appears in the language list once a client has fetched the new `index.json`.
The bundled Russian copy is the `locales/ru.json` of the build, so a release also refreshes the offline fallback.

## Key rotation

Generate a new P-256 key pair, put the private key in `.keys/locale-signing.pem`, replace the JWK in
`src/i18n/publicKey.ts`, run `npm run sign-locales` and release. Older script versions will reject packs
signed with the new key and keep their cached ones.
