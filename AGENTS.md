# AGENTS.md - Kemono Download Button Project Guidelines

## Project Architecture & Design Principles

### 1. DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid)
- Keep modules small, focused, and single-purpose.
- Avoid code duplication in DOM building, API calls, URL generation, and error handling.
- Reuse utility functions (`el()`, `gmXmlhttpRequestWithRetries()`, `getApiUrl()`, `getThumbnailUrl()`, `sanitizeFilename()`).

### 2. Modular TypeScript Layout (`src/`)
- All source code must be maintained as clean TypeScript modules inside `src/`.
- Clear separation of concerns:
  - `src/config/`: Constants, default settings schema, and CSS stylesheets.
  - `src/types/`: Centralized TypeScript interface and type definitions.
  - `src/utils/`: DOM generation helpers, HTTP request wrappers, string/URL helpers.
  - `src/state/`: Storage state management (`GM_getValue`/`GM_setValue`), settings import/export.
  - `src/api/`: Endpoint definitions and REST client functions for Kemono, Coomer, and Pawchive.
  - `src/ui/`: Isolated UI component generators (Settings modal, File picker, Author manager, Bulk panel, Post card buttons, Progress bar manager).
  - `src/services/`: Core logic (ZIP creation, individual downloads, queue processing, link generation, translation).
  - `src/index.ts`: Entry point, SPA/PWA router observer, HTMX event hooks, and UserScript metadata header.

### 3. Progressive Web App (PWA) & HTMX SPA Navigation
- Both Kemono and Pawchive operate as HTMX-boosted PWAs (`hx-boost="true"`, dynamic `#main` element swaps).
- The initialization router MUST handle dynamic PWA transitions:
  - Listen for HTMX events: `htmx:afterSettle`, `htmx:afterSwap`, `htmx:historyRestore`.
  - Intercept History API: `popstate`, `history.pushState`, `history.replaceState`.
  - Floating UI controls (`#kdl-fixed-controls`, `#kdl-progress-container`) MUST be attached directly to `document.body` (outside `#main`), ensuring they are never wiped during HTMX DOM swaps.

### 4. UI Generation & Fidelity Rules
- UI components must be programmatically generated via dedicated component modules (`src/ui/components/*`).
- **100% Visual & Functional Fidelity**: Generated DOM elements must strictly preserve all original IDs, CSS class names, attributes, layout hierarchies, hover states, and color schemes from the source script.

### 5. Externalized Dependencies
- **JSZip**: Must NEVER be bundled into the compiled output. Always use `@require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` in UserScript metadata header and consume `JSZip` from global scope.

### 6. Multi-Domain & Pawchive Support
- Supported site targets:
  - `https://kemono.su/*`, `https://*.kemono.su/*`
  - `https://kemono.cr/*`, `https://*.kemono.cr/*`
  - `https://coomer.su/*`, `https://*.coomer.su/*`
  - `https://coomer.party/*`, `https://*.coomer.party/*`
  - `https://pawchive.pw/*`, `https://*.pawchive.pw/*`
  - `https://pawchive.st/*`, `https://*.pawchive.st/*`
- Never hardcode domain names (such as `kemono.cr`) in API queries or asset URLs. Use `getApiUrl()` and `getThumbnailUrl()` helper functions that dynamically adapt based on `window.location.origin` and `window.location.hostname`.

### 7. Versioning & Output Files
- Always bump the patch version (the 3rd digit, e.g. `0.2.1` -> `0.2.2`) in `package.json` and `src/index.ts` header whenever code changes are made.
- The build process must only generate the single main output file `kemono-download-button.user.js` in the root directory. Do not generate `.txt` or extra version-suffixed `.user.js` files.
