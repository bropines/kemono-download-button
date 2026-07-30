# Kemono & Pawchive Download Button 🚀

![Version](https://img.shields.io/badge/version-0.2.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Build](https://img.shields.io/badge/build-Vite-purple)

A powerful, high-performance UserScript for batch and single-item downloading from **Kemono**, **Coomer**, and **Pawchive** with built-in **IndexedDB persistent binary file caching**, **fflate ZIP engine**, **CDN failover rotation**, and **AI translation capabilities**.

---

## ⚡ Direct Installation (Permanent Auto-Update Link)

Click the link below to install directly into your UserScript manager (**Tampermonkey**, **Violentmonkey**, or **Greasemonkey**). It will automatically check for future updates on GitHub:

👉 [**Install / Update UserScript**](https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js)

---

## 🌐 Supported Sites

| Service | Domains |
| :--- | :--- |
| **Kemono** | `kemono.su`, `*.kemono.su`, `kemono.cr`, `*.kemono.cr` |
| **Coomer** | `coomer.su`, `*.coomer.su`, `coomer.party`, `*.coomer.party` |
| **Pawchive** | `pawchive.pw`, `*.pawchive.pw`, `pawchive.st`, `*.pawchive.st` |

---

## ✨ Features

- **🚀 Ultra-Fast `fflate` ZIP Engine**: Uses `fflate` synchronous packaging (`zipSync`) to build ZIP archives in milliseconds with **0% main-thread freezing**.
- **⚙️ Configurable ZIP Compression Levels**: Choose between Level `0` (Store - Instant, recommended for media) up to Level `9` (Maximum Deflate).
- **💾 IndexedDB Persistent File & Metadata Caching**:
  - Downloaded images/videos are stored locally in IndexedDB as `ArrayBuffer` binaries.
  - Re-downloading or re-zipping already fetched files takes **0ms without network calls**.
  - Integrated Cache Management UI in Settings (Clear Incomplete vs. Clear All Cache with real-time size indicators).
- **🔄 Multi-Domain CDN Failover Node Rotation**: Automatically rotates through mirror nodes (`file.` $\rightarrow$ `c1` $\rightarrow$ `c2` $\rightarrow$ `c3` $\rightarrow$ `c4` $\rightarrow$ `c5` $\rightarrow$ `c6`) if 404 or connection errors occur.
- **📱 PWA & HTMX SPA Navigation Resilience**: Handlers intercept HTMX DOM swaps (`htmx:afterSettle`) and History API state changes so floating download controls remain persistent.
- **🤖 AI Post Translation**: Supports real-time translation of Japanese/foreign post titles and content using **Google Gemini API** or **DeepL API**.
- **📁 Custom File & Folder Templates**: Custom naming patterns with variables: `{author_name}`, `{post_date}`, `{post_title}`, `{post_id}`, `{file_index}`, `{file_name}`.
- **📄 Complete Export Options**: Optional saving of `content.txt`, `metadata.json`, `tags.txt`, and `comments.txt` inside the output ZIP.

---

## 🛠️ Development & Building

The project is structured as a modular TypeScript application bundled with Vite.

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Setup & Installation

```bash
# Clone repository
git clone https://github.com/bropines/kemono-download-button.git
cd kemono-download-button

# Install dependencies
npm install
```

### Build

```bash
npm run build
```

This compiles `src/index.ts` into a self-contained UserScript bundle at the repository root:
- `Kemono Download Button-0.2.1.user.js`
- `Kemono Download Button-0.2.1.txt`

---

## 📜 License

MIT License. Free for personal and non-commercial use.
