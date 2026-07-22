// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @author       hoami_523 + Gemini + bropines
// @description  Modular TypeScript refactor for Kemono, Coomer, and Pawchive
// @icon         https://kemono.cr/static/favicon.ico
// @match        https://kemono.su/*
// @match        https://*.kemono.su/*
// @match        https://kemono.cr/*
// @match        https://*.kemono.cr/*
// @match        https://coomer.su/*
// @match        https://*.coomer.su/*
// @match        https://coomer.party/*
// @match        https://*.coomer.party/*
// @match        https://pawchive.pw/*
// @match        https://*.pawchive.pw/*
// @match        https://pawchive.st/*
// @match        https://*.pawchive.st/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @connect      *
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  const CSS_STYLES = `
#kemono-download-message-box {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #333;
  color: #fff;
  border-radius: 5px;
  z-index: 10001;
  opacity: 0;
  transition: opacity .5s ease-in-out, transform .3s ease-in-out;
  box-shadow: 0 2px 10px #0003;
  transform: translate(110%);
}
.post-card { position: relative; }
.post-card .post-card-download-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
  flex-direction: column;
  gap: 4px;
  background-color: #282828d9;
  padding: 5px;
  border-radius: 4px;
  z-index: 10;
  border: 1px solid rgba(255,255,255,.1);
}
.post-card:hover .post-card-download-controls { display: flex; }
.post-card .post-card-download-controls button {
  padding: 4px 8px;
  font-size: .8em;
  min-width: 65px;
  margin: 0;
  border: none;
  border-radius: 3px;
  color: #fff;
  cursor: pointer;
  text-align: center;
  opacity: .9;
  transition: opacity .2s, background-color .2s;
}
.post-card .post-card-download-controls button:hover { opacity: 1; }
.post-card .post-card-dl-zip { background-color: #28a745; }
.post-card .post-card-dl-zip:hover { background-color: #218838; }
.post-card .post-card-dl-img { background-color: #007bff; }
.post-card .post-card-dl-img:hover { background-color: #0069d9; }
.post-card .post-card-dl-att { background-color: #ffc107; color: #212529!important; }
.post-card .post-card-dl-att:hover { background-color: #e0a800; }
.post-card .post-card-dl-pick { background-color: #6f42c1; }
.post-card .post-card-dl-pick:hover { background-color: #5a32a3; }
.post-card .post-card-dl-info { background-color: #6c757d; }
.post-card .post-card-dl-info:hover { background-color: #5a6268; }
.post-card .post-card-download-controls button:disabled,
.post__actions button[data-is-downloading=true],
.post__actions button[data-is-queued=true] {
  opacity: .6!important;
  cursor: not-allowed!important;
}
.post-card .post-card-download-controls button[data-is-queued=true],
.post__actions button[data-is-queued=true] { background-color: #fd7e14!important; }
.post-card .post-card-download-controls button[data-is-downloading=true],
.post__actions button[data-is-downloading=true] { background-color: #6c757d!important; }

.post__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-top: 5px;
}
.post__actions>* { margin: 0!important; }

#kdl-fixed-controls {
  position: fixed;
  bottom: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 9998;
}
#kdl-queue-indicator {
  background-color: #000000b3;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: .9em;
  box-shadow: 0 1px 5px #0000004d;
}
#kdl-settings-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 5px #0000004d;
}
#kdl-settings-btn:hover { background-color: #0056b3; }

#kdl-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #00000080;
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
}
#kdl-settings-modal {
  background-color: #333;
  color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 5px 20px #0006;
  width: 500px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}
#kdl-settings-modal-content { overflow-y: auto; padding: 0 25px; }
#kdl-settings-modal h2 { margin-top: 25px; margin-bottom: 25px; padding-bottom: 10px; color: #00aeff; border-bottom: 1px solid #555; text-align: center; }
#kdl-settings-modal h3 { margin-top: 20px; margin-bottom: 10px; color: #f0f0f0; border-bottom: 1px solid #444; padding-bottom: 8px; }
#kdl-settings-modal label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: 700; }
#kdl-settings-modal input[type=checkbox] { margin-right: 8px; vertical-align: middle; }
#kdl-settings-modal input[type=number],
#kdl-settings-modal input[type=text],
#kdl-settings-modal input[type=password],
#kdl-settings-modal select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #444;
  color: #f0f0f0;
  box-sizing: border-box;
}
#kdl-settings-modal input[type=number] { width: 80px; }
#kdl-settings-modal small { display: block; font-size: .8em; color: #aaa; margin-top: 4px; font-weight: 400; }
.kdl-settings-actions {
  text-align: right;
  padding: 15px 25px;
  background-color: #3a3a3a;
  border-top: 1px solid #444;
  margin-top: auto;
  position: sticky;
  bottom: 0;
}
#kdl-settings-modal button { padding: 10px 18px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-weight: 700; }
#kdl-settings-modal button.kdl-save { background-color: #28a745; color: #fff; }
#kdl-settings-modal button.kdl-save:hover { background-color: #218838; }
#kdl-settings-modal button.kdl-close { background-color: #6c757d; color: #fff; }
#kdl-settings-modal button.kdl-close:hover { background-color: #5a6268; }
#kdl-settings-modal .kdl-setting-item { margin-bottom: 10px; }

#kdl-progress-container {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  width: 80vw;
  max-width: 800px;
  max-height: 40vh;
  overflow-y: auto;
  z-index: 10002;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  padding-bottom: 10px;
}
.kdl-progress-task {
  background-color: #282b30e6;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  color: #f0f0f0;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px #0000004d;
  border: 1px solid rgba(255,255,255,.1);
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.kdl-task-header { display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
.kdl-task-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: .95em; }
.kdl-task-status { font-size: .85em; color: #ccc; }
.kdl-task-files { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; }
.kdl-progress-bar-wrapper { width: 100%; }
.kdl-progress-bar-label { color: #ddd; font-size: .8em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.kdl-progress-bar-label.kdl-success { color: #28a745; }
.kdl-progress-bar-label.kdl-error { color: #dc3545; }
.kdl-progress-bar { width: 100%; height: 8px; background-color: #555; border-radius: 4px; overflow: hidden; }
.kdl-progress-bar-inner { width: 0%; height: 100%; background-color: #007bff; transition: width .1s linear, background-color .3s; }
.kdl-progress-bar-inner.kdl-success { background-color: #28a745!important; }
.kdl-progress-bar-inner.kdl-error { background-color: #dc3545!important; }

#kdl-bulk-panel {
  position: sticky;
  top: 10px;
  background-color: #282828e6;
  padding: 10px;
  border-radius: 8px;
  z-index: 800;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  border: 1px solid #555;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  margin-bottom: 10px;
}
#kdl-bulk-panel button { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: .9em; color: #fff; }
#kdl-bulk-download-btn { background-color: #28a745; }
#kdl-bulk-download-btn:disabled { background-color: #6c757d; cursor: not-allowed; }
#kdl-bulk-select-all { background-color: #007bff; }
#kdl-bulk-deselect-all { background-color: #dc3545; }

.kdl-post-checkbox {
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 11;
  width: 20px;
  height: 20px;
  cursor: pointer;
  padding: 5px;
  margin: 0;
  background-clip: content-box;
}

#kdl-file-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000000b3;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10003;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}
#kdl-file-picker-modal {
  background-color: #2b2b2b;
  color: #f0f0f0;
  border-radius: 8px;
  padding: 20px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px #0000004d;
  border: 1px solid #555;
}
#kdl-file-picker-modal h4 { margin: 0 0 15px; color: #00aeff; border-bottom: 1px solid #444; padding-bottom: 10px; text-align: center; }
#kdl-file-picker-list { overflow-y: auto; list-style: none; padding: 0; margin: 0; }
#kdl-file-picker-list li { margin-bottom: 5px; }
#kdl-file-picker-list a {
  display: block;
  padding: 8px 12px;
  background-color: #3a3a3a;
  border-radius: 4px;
  color: #e0e0e0;
  text-decoration: none;
  transition: background-color .2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#kdl-file-picker-list a:hover { background-color: #4a4a4a; color: #fff; }

.kdl-post-info-tooltip {
  position: absolute;
  bottom: 100%;
  right: 0;
  background-color: #1a1a1a;
  color: #f0f0f0;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #555;
  z-index: 801;
  width: 200px;
  font-size: .85em;
  display: none;
  pointer-events: none;
  box-shadow: 0 3px 10px #00000080;
}

#kdl-author-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000000b3;
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10003;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}
#kdl-author-manager-modal {
  background-color: #2b2b2b;
  color: #f0f0f0;
  border-radius: 8px;
  width: 800px;
  max-width: 95vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px #0000004d;
  border: 1px solid #555;
}
#kdl-manager-header { padding: 15px 20px; border-bottom: 1px solid #444; }
#kdl-manager-header h3 { margin: 0; color: #00aeff; }
#kdl-manager-controls { display: flex; gap: 10px; padding: 10px 20px; border-bottom: 1px solid #444; align-items: center; }
#kdl-manager-search { flex-grow: 1; padding: 8px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #f0f0f0; }
.kdl-manager-btn { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; }
#kdl-manager-post-list { overflow-y: auto; flex-grow: 1; padding: 10px 20px; }
#kdl-manager-post-list .post-item { display: flex; align-items: center; padding: 8px; border-radius: 4px; margin-bottom: 5px; cursor: pointer; transition: background-color .2s; }
#kdl-manager-post-list .post-item:hover { background-color: #3a3a3a; }
#kdl-manager-post-list .post-item input[type=checkbox] { margin-right: 15px; width: 18px; height: 18px; }
.post-item-label { display: flex; flex-direction: column; }
.post-item-title { font-weight: 700; }
.post-item-date { font-size: .8em; color: #aaa; }
#kdl-manager-footer { padding: 15px 20px; border-top: 1px solid #444; margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.post-item-preview { width: 64px; height: 64px; object-fit: cover; margin-right: 15px; border-radius: 4px; background-color: #3a3a3a; }
.post-item-open-link { margin-left: auto; padding: 4px 8px; font-size: 1.2em; line-height: 1; text-decoration: none; border-radius: 4px; transition: background-color .2s; color: #f0f0f0; }
.post-item-open-link:hover { background-color: #4f4f4f; }

.user-card, .post-card { position: relative!important; }
.kdl-quick-fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 12;
  background: #141414b3;
  border: 1px solid rgba(255,255,255,.2);
  color: #fff;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s, color .2s, opacity .2s;
  opacity: 0;
  pointer-events: none;
}
.user-card:hover .kdl-quick-fav-btn, .post-card:hover .kdl-quick-fav-btn { opacity: .9; pointer-events: auto; }
.kdl-quick-fav-btn:hover { opacity: 1; transform: scale(1.1); }
.kdl-quick-fav-btn.kdl-favorited { color: #ffeb3b; }
.kdl-quick-fav-btn:disabled { cursor: wait; color: #888; }
`;
  const DEFAULT_SETTINGS = {
    savePostTags: true,
    savePostComments: false,
    sessionCookie: "",
    enableAPIFetch: true,
    enableDebugLogging: false,
    savePostContentAsText: true,
    maxConcurrentFileDownloadsInZip: 5,
    maxConcurrentOperations: 1,
    showZipButton: true,
    showImagesButton: true,
    showFilesButton: true,
    showCopyLinksButton: true,
    showShareButton: true,
    showTranslateButton: true,
    translationProvider: "none",
    translationLanguage: "Russian",
    geminiApiKey: "",
    translationModelName: "gemini-1.5-flash-latest",
    deeplApiKey: "",
    deeplApiTier: "free",
    maxConcurrentIndividualDownloads: 4,
    enableDownloadRetries: true,
    downloadRetryCount: 2,
    downloadRetryDelay: 2e3,
    zipFileDownloadTimeout: 3e5,
    addMetadataFile: true,
    addHtmlIndexInZip: true,
    fileNameTemplate: "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}",
    bulkDownloadMode: "single",
    bulkSingleSystemPathTemplate: "{author_name}/[Kemono] {author_name} - {post_count} posts.zip",
    bulkSingleInternalPathTemplate: "{post_date}_{post_title}/{file_index}_{file_name}",
    cacheDurationHours: 24,
    bulkMultipleSystemPathTemplate: "{author_name}/{post_date}_{post_title}.zip",
    savedFileNameTemplates: []
  };
  function debugLog(...args) {
    if (state.settings.enableDebugLogging) {
      console.log("[Kemono DL Debug]", ...args);
    }
  }
  function getFullUrl(path) {
    return path.startsWith("/") ? window.location.origin + path : path;
  }
  function resolveMediaUrl(path, originalFileName) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith("/data/") ? path : path.startsWith("data/") ? "/" + path : path.startsWith("/") ? "/data" + path : "/data/" + path;
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    let querySuffix = "";
    if (originalFileName && !cleanPath.includes("?f=")) {
      querySuffix = `?f=${encodeURIComponent(originalFileName)}`;
    }
    if (hostname.match(/^(c\d+|file)\./)) {
      return `${window.location.origin}${cleanPath}${querySuffix}`;
    }
    if (baseDomain.includes("pawchive")) {
      return `https://file.${baseDomain}${cleanPath}${querySuffix}`;
    }
    return `https://c1.${baseDomain}${cleanPath}${querySuffix}`;
  }
  function getApiUrl(path) {
    const cleanPath = path.startsWith("/") ? path : "/" + path;
    return `${window.location.origin}${cleanPath}`;
  }
  function getThumbnailUrl(path) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    return `https://img.${baseDomain}/thumbnail/${cleanPath}`;
  }
  function sanitizeFilename(filename) {
    return String(filename || "untitled").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim() || "untitled";
  }
  function generateRandomId(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  function htmlToFormattedText(html) {
    if (!html) return "";
    const processedHtml = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n\s*\n/g, "\n\n");
    const textarea = document.createElement("textarea");
    textarea.innerHTML = processedHtml;
    return textarea.value.trim();
  }
  function waitForElement(selector, timeout = 5e3) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);
      const observer = new MutationObserver(() => {
        const el2 = document.querySelector(selector);
        if (el2) {
          observer.disconnect();
          resolve(el2);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: Element ${selector} not found`));
      }, timeout);
    });
  }
  const state = {
    settings: { ...DEFAULT_SETTINGS }
  };
  const appState = {
    globalMediaCounter: 0,
    cachedPostFiles: null,
    originalPostContentHTML: null,
    downloadQueue: [],
    isQueueProcessing: false,
    activeOperations: 0,
    selectedPostIds: /* @__PURE__ */ new Set(),
    translationCache: {},
    favoritedArtists: /* @__PURE__ */ new Set(),
    favoritedPosts: /* @__PURE__ */ new Set(),
    favoritesFetched: false,
    queueIndicatorElement: null
  };
  function resetMediaCounter() {
    appState.globalMediaCounter = 0;
  }
  let settingsLoadPromise = null;
  async function _loadSettingsAsync() {
    const loadedSettings = {};
    const keys = Object.keys(DEFAULT_SETTINGS);
    const values = await Promise.all(
      keys.map((key) => GM_getValue(key, DEFAULT_SETTINGS[key]))
    );
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      loadedSettings[key] = values[i];
    }
    state.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
    debugLog("Settings loaded:", state.settings);
  }
  function getSettings() {
    if (!settingsLoadPromise) {
      settingsLoadPromise = _loadSettingsAsync();
    }
    return settingsLoadPromise;
  }
  async function saveSetting(key, value) {
    await GM_setValue(key, value);
    state.settings[key] = value;
  }
  async function exportSettings() {
    await getSettings();
    const settingsJson = JSON.stringify(state.settings, null, 2);
    const blob = new Blob([settingsJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    GM_download({
      url,
      name: `kemono-downloader-settings-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`,
      saveAs: true,
      onload: () => URL.revokeObjectURL(url)
    });
  }
  async function importSettings(jsonString) {
    const newSettings = JSON.parse(jsonString);
    await getSettings();
    let importCount = 0;
    for (const key in DEFAULT_SETTINGS) {
      const k = key;
      if (Object.prototype.hasOwnProperty.call(newSettings, k)) {
        if (typeof newSettings[k] === typeof DEFAULT_SETTINGS[k]) {
          GM_setValue(k, newSettings[k]);
          state.settings[k] = newSettings[k];
          importCount++;
        }
      }
    }
    settingsLoadPromise = null;
    await getSettings();
    return importCount;
  }
  function el(tag, props = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "style" && typeof value === "object" && value !== null) {
        Object.assign(element.style, value);
      } else if (key === "dataset" && typeof value === "object" && value !== null) {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          element.dataset[dataKey] = String(dataValue);
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element[key] = value;
      }
    }
    children.forEach((child) => {
      if (!child) return;
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  }
  function getOrCreateContainer(id, tag = "div") {
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement(tag);
      container.id = id;
      document.body.appendChild(container);
    }
    return container;
  }
  let messageBoxTimeout = null;
  function showMessage(message, type = "info") {
    const box = getOrCreateContainer("kemono-download-message-box");
    if (type === "error") box.style.backgroundColor = "#dc3545";
    else if (type === "warning") box.style.backgroundColor = "#ffc107";
    else box.style.backgroundColor = "#333";
    box.style.color = type === "warning" ? "#212529" : "#fff";
    box.textContent = message;
    box.style.opacity = "1";
    box.style.transform = "translate(0)";
    if (messageBoxTimeout) clearTimeout(messageBoxTimeout);
    messageBoxTimeout = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translate(110%)";
    }, 4e3);
  }
  async function gmXmlhttpRequestWithRetries(details) {
    const maxRetries = state.settings.enableDownloadRetries ? state.settings.downloadRetryCount : 0;
    const retryDelay = state.settings.downloadRetryDelay;
    let attempts = 0;
    let currentUrl = details.url;
    while (attempts <= maxRetries + 4) {
      try {
        return await new Promise((resolve, reject) => {
          const headers = details.headers || {};
          if (state.settings.sessionCookie) {
            headers["Cookie"] = state.settings.sessionCookie;
          }
          GM_xmlhttpRequest({
            ...details,
            url: currentUrl,
            headers,
            onload: (response) => {
              if (response.status >= 200 && response.status < 300) {
                resolve(response);
              } else {
                reject(new Error(`HTTP Status ${response.status}: ${response.statusText}`));
              }
            },
            onerror: (error) => {
              let errStr = "";
              if (typeof error === "string") {
                errStr = error;
              } else if (error && typeof error === "object") {
                errStr = error.error || error.statusText || error.responseText || (error.status ? `Status ${error.status}` : "") || JSON.stringify(error);
              } else {
                errStr = String(error || "Network Error");
              }
              if (errStr.includes("BLOCKED") || errStr.includes("blocked")) {
                reject(new Error(`Blocked by browser/AdBlocker extension (${errStr})`));
              } else {
                reject(new Error(errStr || "Network Error"));
              }
            },
            ontimeout: () => reject(new Error("Request Timeout"))
          });
        });
      } catch (error) {
        attempts++;
        const fileMatch = currentUrl.match(/https:\/\/(file|c\d+)\.([^/]+)(\/.*)/);
        if (fileMatch) {
          const prefix = fileMatch[1];
          const domain = fileMatch[2];
          const path = fileMatch[3];
          if (prefix === "file") {
            currentUrl = `https://c1.${domain}${path}`;
          } else {
            const currentCdnNum = parseInt(prefix.replace("c", ""), 10);
            const nextCdnNum = currentCdnNum % 6 + 1;
            currentUrl = `https://c${nextCdnNum}.${domain}${path}`;
          }
          debugLog(`CDN node fallback: switching to ${currentUrl}`);
        } else {
          const mainMatch = currentUrl.match(/https:\/\/([^/]+)(\/data\/.*)/);
          if (mainMatch && !mainMatch[1].startsWith("c") && !mainMatch[1].startsWith("file")) {
            currentUrl = `https://file.${mainMatch[1]}${mainMatch[2]}`;
            debugLog(`CDN fallback: switching from main domain to ${currentUrl}`);
          }
        }
        if (attempts > maxRetries + 4) {
          throw error;
        }
        debugLog(`Attempt ${attempts} failed for ${details.url}: ${error.message}. Retrying in ${retryDelay}ms...`);
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }
  async function fetchPostDataFromAPI(service, userID, postID) {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
    debugLog(`Fetching post data from API: ${url}`);
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      responseType: "json",
      timeout: 3e4
    });
    return response.response;
  }
  async function fetchAllAuthorPosts(service, userID, progressTask) {
    let allPosts = [];
    let offset = 0;
    const limit = 50;
    while (true) {
      try {
        if (progressTask) ;
        const url = getApiUrl(`/api/v1/${service}/user/${userID}/posts?o=${offset}`);
        const response = await gmXmlhttpRequestWithRetries({
          method: "GET",
          url,
          responseType: "json",
          timeout: 3e4
        });
        const postsOnPage = response.response;
        if (!Array.isArray(postsOnPage) || postsOnPage.length === 0) break;
        allPosts = allPosts.concat(postsOnPage);
        offset += limit;
        await new Promise((res) => setTimeout(res, 200));
      } catch (error) {
        if (error.message && error.message.includes("Status 400")) {
          debugLog("Reached end of posts (API returned 400). This is a normal exit condition.");
        } else {
          console.error(`Failed to fetch posts at offset ${offset}:`, error);
          showMessage("Error fetching full post list. The result may be incomplete.", "error");
        }
        break;
      }
    }
    return allPosts;
  }
  async function fetchUserFavorites() {
    if (appState.favoritesFetched) return true;
    await getSettings();
    if (!state.settings.sessionCookie) {
      return false;
    }
    debugLog("Fetching user favorites from API...");
    try {
      const [artistsRes, postsRes] = await Promise.all([
        gmXmlhttpRequestWithRetries({
          method: "GET",
          url: getApiUrl("/api/v1/account/favorites?type=artist"),
          responseType: "json"
        }),
        gmXmlhttpRequestWithRetries({
          method: "GET",
          url: getApiUrl("/api/v1/account/favorites?type=post"),
          responseType: "json"
        })
      ]);
      if (artistsRes.response && Array.isArray(artistsRes.response)) {
        artistsRes.response.forEach((artist) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
      }
      if (postsRes.response && Array.isArray(postsRes.response)) {
        postsRes.response.forEach((post) => appState.favoritedPosts.add(post.id));
      }
      appState.favoritesFetched = true;
      debugLog(`Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
      return true;
    } catch (error) {
      if (error.message && error.message.includes("Status 401")) {
        showMessage("Favorites: Auth failed. Check your session cookie.", "error");
      } else {
        console.error("Failed to fetch favorites:", error);
      }
      return false;
    }
  }
  async function toggleFavorite(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites. Please set it in the script settings.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.textContent = "⏳";
    button.disabled = true;
    try {
      await gmXmlhttpRequestWithRetries({
        method,
        url: getApiUrl(apiUrl)
      });
      if (isFavorited) {
        if (type === "creator") appState.favoritedArtists.delete(artistKey);
        else if (postId) appState.favoritedPosts.delete(postId);
      } else {
        if (type === "creator") appState.favoritedArtists.add(artistKey);
        else if (postId) appState.favoritedPosts.add(postId);
      }
      if (updateCardStateFn) {
        updateCardStateFn(button.closest(".user-card, .post-card"), !isFavorited, type);
      }
      showMessage(`Successfully ${isFavorited ? "removed from" : "added to"} favorites!`, "info");
    } catch (error) {
      console.error("Favorite toggle failed:", error);
      showMessage("Failed to update favorites. Check console for details.", "error");
    } finally {
      button.textContent = "⭐";
      button.disabled = false;
    }
  }
  let settingsModalElement = null;
  let settingsOverlayElement = null;
  async function toggleSettingsModal(forceShow) {
    try {
      await getSettings();
    } catch (e) {
      console.error("[Kemono DL] Error loading settings:", e);
    }
    if (!settingsModalElement) createSettingsModal();
    const computedDisplay = settingsOverlayElement ? window.getComputedStyle(settingsOverlayElement).display : "none";
    const isCurrentlyHidden = computedDisplay === "none";
    const displayState = typeof forceShow === "boolean" ? forceShow : isCurrentlyHidden;
    if (displayState) {
      updateSettingsModalUI();
      settingsOverlayElement.style.display = "flex";
    } else {
      settingsOverlayElement.style.display = "none";
    }
  }
  function createSettingsModal() {
    if (settingsModalElement) return;
    const langCodeMap = {
      auto: "auto",
      russian: "ru",
      english: "en",
      chinese: "zh",
      japanese: "ja",
      korean: "ko"
    };
    const languageOptions = Object.keys(langCodeMap).map((name) => `<option value="${name}">${name.charAt(0).toUpperCase() + name.slice(1)}</option>`).join("");
    settingsOverlayElement = el("div", { id: "kdl-settings-overlay" });
    settingsModalElement = el("div", { id: "kdl-settings-modal" });
    settingsModalElement.innerHTML = `
    <div id="kdl-settings-modal-content">
        <h2>Downloader Settings</h2>
        <h3>General</h3>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableAPIFetch"> Enable Site API Fetching</label></div>
        <div class="kdl-setting-item"><label>Session Cookie <input type="password" id="kdl-setting-sessionCookie" placeholder="Paste session cookie here"></label><small>Needed for API requests that require login.</small></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostContentAsText"> Save Post Content as .txt in ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-addMetadataFile"> Add metadata.json to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-addHtmlIndexInZip"> Add _index.html to Bulk ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostTags"> Add tags.txt to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostComments"> Add comments.txt to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableDebugLogging"> Enable Debug Logging (Console)</label></div>
        <div class="kdl-setting-item">
            <label for="kdl-setting-cacheDurationHours">Post List Cache Duration (Hours)</label>
            <input type="number" id="kdl-setting-cacheDurationHours" min="0" step="1">
            <small>0 = disable caching. How long to store the full post list before re-fetching.</small>
        </div>

        <h3>File Naming & Structure</h3>
        <div class="kdl-setting-item">
            <label for="kdl-setting-fileNameTemplate">Template for <u>Individual Downloads</u></label>
            <input type="text" id="kdl-setting-fileNameTemplate">
            <small>Defines the save path for single files. <b>Example:</b> {author_name}/{post_date}_{post_title}/{file_name}</small>
        </div>
        <div class="kdl-setting-item">
            <label for="kdl-template-select">Saved Templates</label>
            <div style="display: flex; gap: 5px;">
                <select id="kdl-template-select" style="flex-grow: 1;"></select>
                <button id="kdl-template-delete-btn" style="padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px;">Delete</button>
            </div>
            <div style="display: flex; gap: 5px; margin-top: 5px;">
                <input type="text" id="kdl-template-name-input" placeholder="New template name..." style="flex-grow: 1;">
                <button id="kdl-template-save-btn" style="padding: 5px 10px; background-color: #28a745; color: white; border: none; border-radius: 4px;">Save Current</button>
            </div>
        </div>

        <h4>Bulk Download Settings</h4>
        <div class="kdl-setting-item">
            <label for="kdl-setting-bulkDownloadMode">Bulk Download Mode</label>
            <select id="kdl-setting-bulkDownloadMode">
                <option value="single">One Big Archive</option>
                <option value="multiple">Multiple Archives (one per post)</option>
            </select>
        </div>
        <div id="kdl-bulk-single-settings">
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkSingleSystemPathTemplate"><u>System Path</u> for the Big Archive</label>
                <input type="text" id="kdl-setting-bulkSingleSystemPathTemplate">
            </div>
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkSingleInternalPathTemplate"><u>Internal Structure</u> inside the Big Archive</label>
                <input type="text" id="kdl-setting-bulkSingleInternalPathTemplate">
            </div>
        </div>
        <div id="kdl-bulk-multiple-settings" style="display:none;">
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkMultipleSystemPathTemplate"><u>System Path</u> for Multiple Archives</label>
                <input type="text" id="kdl-setting-bulkMultipleSystemPathTemplate">
            </div>
        </div>

        <h3>Visible Buttons</h3>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showZipButton"> Download (ZIP)</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showImagesButton"> Download Images</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showFilesButton"> Download Attachments</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showCopyLinksButton"> Copy Links</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showShareButton"> Share Links (Mobile)</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showTranslateButton"> Translate Button</label></div>

        <h3>Downloads</h3>
        <div class="kdl-setting-item"><label for="kdl-setting-maxConcurrentIndividualDownloads">Max Concurrent "Images/Files" Downloads</label><input type="number" id="kdl-setting-maxConcurrentIndividualDownloads" min="1" max="10"></div>
        <div class="kdl-setting-item"><label for="kdl-setting-zipFileDownloadTimeout">File Timeout in ZIP (ms)</label><input type="number" id="kdl-setting-zipFileDownloadTimeout" min="10000" step="1000"></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableDownloadRetries"> Enable Download Retries</label></div>
        <div class="kdl-setting-item" id="kdl-retry-count-setting"><label for="kdl-setting-downloadRetryCount">Number of Retries</label><input type="number" id="kdl-setting-downloadRetryCount" min="0" max="5"></div>
        <div class="kdl-setting-item" id="kdl-retry-delay-setting"><label for="kdl-setting-downloadRetryDelay">Delay Between Retries (ms)</label><input type="number" id="kdl-setting-downloadRetryDelay" min="500" step="500"></div>

        <h3>Translation</h3>
        <div class="kdl-setting-item">
            <label for="kdl-setting-translationProvider">Translation Provider</label>
            <select id="kdl-setting-translationProvider">
                <option value="none">None</option><option value="gemini">Gemini</option><option value="deepl">DeepL</option><option value="yandex">Yandex (Free)</option><option value="google">Google (Free)</option>
            </select>
        </div>
        <div class="kdl-setting-item"><label for="kdl-setting-translationLanguage">Translate to Language</label><select id="kdl-setting-translationLanguage">${languageOptions}</select></div>
        <div id="kdl-gemini-settings" style="display:none;"><div class="kdl-setting-item"><label>Gemini API Key</label><input type="password" id="kdl-setting-geminiApiKey"></div><div class="kdl-setting-item"><label>Model Name</label><input type="text" id="kdl-setting-translationModelName"></div></div>
        <div id="kdl-deepl-settings" style="display:none;"><div class="kdl-setting-item"><label>DeepL API Key</label><input type="password" id="kdl-setting-deeplApiKey"></div><div class="kdl-setting-item"><label>API Tier</label><select id="kdl-setting-deeplApiTier"><option value="free">Free</option><option value="pro">Pro</option></select></div></div>

        <h3>Manage Settings</h3>
        <div class="kdl-setting-item" style="display: flex; gap: 10px; justify-content: center;">
            <button id="kdl-export-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px;">Export Settings</button>
            <button id="kdl-import-btn" style="padding: 8px 15px; background-color: #17a2b8; color: white; border: none; border-radius: 4px;">Import Settings</button>
            <input type="file" id="kdl-import-file-input" accept=".json" style="display: none;">
        </div>
    </div>
    <div class="kdl-settings-actions"><button class="kdl-close">Close</button><button class="kdl-save">Save</button></div>
  `;
    settingsOverlayElement.appendChild(settingsModalElement);
    document.body.appendChild(settingsOverlayElement);
    settingsModalElement.querySelector(".kdl-save").addEventListener("click", async () => {
      for (const key in DEFAULT_SETTINGS) {
        if (key === "savedFileNameTemplates") continue;
        const element = document.getElementById(`kdl-setting-${key}`);
        if (element) {
          let value = element.type === "checkbox" ? element.checked : element.type === "number" ? parseInt(element.value, 10) : element.value;
          await saveSetting(key, value);
        }
      }
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates || []);
      showMessage("Settings saved!", "info");
      toggleSettingsModal(false);
    });
    settingsModalElement.querySelector(".kdl-close").addEventListener("click", () => toggleSettingsModal(false));
    settingsOverlayElement.addEventListener("click", (e) => {
      if (e.target === settingsOverlayElement) toggleSettingsModal(false);
    });
    document.getElementById("kdl-export-btn").addEventListener("click", exportSettings);
    const importInput = document.getElementById("kdl-import-file-input");
    document.getElementById("kdl-import-btn").addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", (e) => {
      var _a;
      const file = (_a = e.target.files) == null ? void 0 : _a[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        var _a2;
        const count = await importSettings((_a2 = ev.target) == null ? void 0 : _a2.result);
        updateSettingsModalUI();
        showMessage(`Successfully imported ${count} settings!`, "info");
      };
      reader.readAsText(file);
      importInput.value = "";
    });
    document.getElementById("kdl-setting-bulkDownloadMode").addEventListener("change", (e) => {
      const isSingleMode = e.target.value === "single";
      document.getElementById("kdl-bulk-single-settings").style.display = isSingleMode ? "block" : "none";
      document.getElementById("kdl-bulk-multiple-settings").style.display = isSingleMode ? "none" : "block";
    });
    document.getElementById("kdl-setting-translationProvider").addEventListener("change", toggleTranslatorSettingsVisibility);
    document.getElementById("kdl-setting-enableDownloadRetries").addEventListener("change", toggleRetrySettingsVisibility);
    const templateSelect = document.getElementById("kdl-template-select");
    const templateNameInput = document.getElementById("kdl-template-name-input");
    const fileNameTemplateInput = document.getElementById("kdl-setting-fileNameTemplate");
    templateSelect.addEventListener("change", () => {
      if (templateSelect.value) fileNameTemplateInput.value = templateSelect.value;
    });
    document.getElementById("kdl-template-save-btn").addEventListener("click", () => {
      const name = templateNameInput.value.trim();
      const template = fileNameTemplateInput.value.trim();
      if (!name || !template) return showMessage("Please provide a name and a template pattern.", "warning");
      if (!state.settings.savedFileNameTemplates) state.settings.savedFileNameTemplates = [];
      const existingIndex = state.settings.savedFileNameTemplates.findIndex((t) => t.name === name);
      if (existingIndex > -1) state.settings.savedFileNameTemplates[existingIndex].template = template;
      else state.settings.savedFileNameTemplates.push({ name, template });
      templateNameInput.value = "";
      updateSettingsModalUI();
      showMessage(`Template "${name}" saved!`, "info");
    });
    document.getElementById("kdl-template-delete-btn").addEventListener("click", () => {
      const selectedIndex = templateSelect.selectedIndex;
      if (selectedIndex < 1) return showMessage("Select a template to delete first.", "warning");
      const templateNameToDelete = templateSelect.options[selectedIndex].dataset.name;
      state.settings.savedFileNameTemplates = (state.settings.savedFileNameTemplates || []).filter((t) => t.name !== templateNameToDelete);
      updateSettingsModalUI();
      showMessage(`Template "${templateNameToDelete}" deleted.`, "info");
    });
  }
  function updateSettingsModalUI() {
    if (!settingsModalElement) return;
    for (const key in state.settings) {
      const element = document.getElementById(`kdl-setting-${key}`);
      if (element) {
        if (element.type === "checkbox") element.checked = state.settings[key];
        else element.value = state.settings[key];
      }
    }
    const templateSelect = document.getElementById("kdl-template-select");
    templateSelect.innerHTML = '<option value="">-- Load a saved template --</option>';
    if (state.settings.savedFileNameTemplates && state.settings.savedFileNameTemplates.length > 0) {
      state.settings.savedFileNameTemplates.forEach((item) => {
        const option = document.createElement("option");
        option.textContent = item.name;
        option.value = item.template;
        option.dataset.name = item.name;
        templateSelect.appendChild(option);
      });
    }
    const isSingleMode = state.settings.bulkDownloadMode === "single";
    document.getElementById("kdl-bulk-single-settings").style.display = isSingleMode ? "block" : "none";
    document.getElementById("kdl-bulk-multiple-settings").style.display = isSingleMode ? "none" : "block";
    toggleTranslatorSettingsVisibility();
    toggleRetrySettingsVisibility();
  }
  function toggleTranslatorSettingsVisibility() {
    var _a;
    const provider = (_a = document.getElementById("kdl-setting-translationProvider")) == null ? void 0 : _a.value;
    document.getElementById("kdl-gemini-settings").style.display = provider === "gemini" ? "block" : "none";
    document.getElementById("kdl-deepl-settings").style.display = provider === "deepl" ? "block" : "none";
  }
  function toggleRetrySettingsVisibility() {
    var _a;
    const enabled = (_a = document.getElementById("kdl-setting-enableDownloadRetries")) == null ? void 0 : _a.checked;
    document.getElementById("kdl-retry-count-setting").style.display = enabled ? "block" : "none";
    document.getElementById("kdl-retry-delay-setting").style.display = enabled ? "block" : "none";
  }
  function createFixedControls() {
    if (document.getElementById("kdl-fixed-controls")) return;
    const container = getOrCreateContainer("kdl-fixed-controls");
    appState.queueIndicatorElement = el("div", { id: "kdl-queue-indicator" });
    updateQueueIndicator();
    const settingsBtn = el(
      "button",
      {
        id: "kdl-settings-btn",
        title: "Kemono Downloader Settings",
        onClick: () => toggleSettingsModal()
      },
      ["⚙️"]
    );
    container.appendChild(appState.queueIndicatorElement);
    container.appendChild(settingsBtn);
  }
  function updateQueueIndicator() {
    if (!appState.queueIndicatorElement) return;
    const total = appState.downloadQueue.length;
    if (total === 0 && appState.activeOperations === 0) {
      appState.queueIndicatorElement.style.display = "none";
    } else {
      appState.queueIndicatorElement.style.display = "block";
      appState.queueIndicatorElement.textContent = `Queue: ${appState.activeOperations} active, ${total} waiting`;
    }
  }
  function getPostDetailsFromPage() {
    var _a, _b, _c, _d, _e, _f;
    const pathParts = window.location.pathname.split("/");
    let service = "unknown";
    let userID = "unknown";
    let postID = "unknown";
    if (pathParts.includes("user") && pathParts.includes("post")) {
      const userIndex = pathParts.indexOf("user");
      service = pathParts[userIndex - 1] || "unknown";
      userID = pathParts[userIndex + 1] || "unknown";
      postID = pathParts[pathParts.indexOf("post") + 1] || "unknown";
    }
    const authorName = ((_b = (_a = document.querySelector(".post__user-name")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_d = (_c = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "UnknownAuthor";
    const postTitle = ((_f = (_e = document.querySelector(".post__title span")) == null ? void 0 : _e.textContent) == null ? void 0 : _f.trim()) || "UntitledPost";
    const postDateNode = document.querySelector(".post__published");
    let postDate = "UnknownDate";
    if (postDateNode && postDateNode.textContent) {
      const dateMatch = postDateNode.textContent.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) postDate = dateMatch[0];
    }
    const postContentNode = document.querySelector(".post__content");
    const postContent = postContentNode ? htmlToFormattedText(postContentNode.innerHTML) : "";
    return { service, userID, authorName, postID, postTitle, postDate, postContent };
  }
  function getPostCardDetails(cardNode, pageAuthorName) {
    var _a, _b, _c, _d;
    const linkNode = cardNode.querySelector("a");
    const href = linkNode ? linkNode.getAttribute("href") || "" : "";
    const pathParts = href.split("/");
    let service = "unknown";
    let userID = "unknown";
    let postID = "unknown";
    if (pathParts.includes("user") && pathParts.includes("post")) {
      const userIndex = pathParts.indexOf("user");
      service = pathParts[userIndex - 1] || "unknown";
      userID = pathParts[userIndex + 1] || "unknown";
      postID = pathParts[pathParts.indexOf("post") + 1] || "unknown";
    } else {
      postID = cardNode.dataset.id || "UnknownPostID";
      userID = cardNode.dataset.user || "UnknownUserID";
      service = cardNode.dataset.service || "UnknownService";
    }
    const postTitle = ((_b = (_a = cardNode.querySelector(".post-card__header")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "UntitledPost";
    const postDate = ((_d = (_c = cardNode.querySelector(".post-card__footer time")) == null ? void 0 : _c.getAttribute("datetime")) == null ? void 0 : _d.split("T")[0]) || "UnknownDate";
    return { service, userID, authorName: pageAuthorName, postID, postTitle, postDate };
  }
  function formatNameFromTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const sanitizedVal = sanitizeFilename(String(value ?? ""));
      result = result.replace(new RegExp(`{${key}}`, "g"), sanitizedVal);
    }
    return result.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  }
  function generateFilePath(template, fileData, postDetails) {
    const combinedData = {
      post_date: postDetails.postDate || "UnknownDate",
      author_name: postDetails.authorName,
      post_title: postDetails.postTitle,
      post_id: postDetails.postID,
      user_id: postDetails.userID,
      service: postDetails.service,
      ...fileData
    };
    return formatNameFromTemplate(template, combinedData);
  }
  async function collectFilesForPost(postDetails, options = {}) {
    var _a;
    await getSettings();
    const files = [];
    let isApiSuccess = false;
    let rawApiData = null;
    const isPostPage = window.location.pathname.includes("/post/");
    const templateToUse = options.template || state.settings.fileNameTemplate;
    if (!options.isBulk && !options.noFiles) {
      resetMediaCounter();
    }
    if (state.settings.enableAPIFetch && postDetails.service !== "unknown" && postDetails.userID !== "unknown" && postDetails.postID !== "unknown") {
      try {
        rawApiData = await fetchPostDataFromAPI(postDetails.service, postDetails.userID, postDetails.postID);
        const post = (rawApiData == null ? void 0 : rawApiData.post) || (Array.isArray(rawApiData) ? rawApiData[0] : rawApiData);
        if (post) {
          postDetails.rawApiData = post;
          if (post.published) postDetails.postDate = new Date(post.published).toISOString().split("T")[0];
          if (post.title) postDetails.postTitle = post.title;
          if (post.content) postDetails.postContent = htmlToFormattedText(post.content);
          isApiSuccess = true;
        }
      } catch (e) {
        debugLog("API Fetch failed, falling back to DOM parsing.", e);
      }
    }
    if (options.noFiles) {
      return { files: [], postDate: postDetails.postDate || "UnknownDate" };
    }
    if (isApiSuccess && postDetails.rawApiData) {
      const post = postDetails.rawApiData;
      const allMediaFiles = [];
      if ((_a = post.file) == null ? void 0 : _a.path) {
        allMediaFiles.push({ name: post.file.name || post.file.path.split("/").pop(), path: post.file.path });
      }
      if (Array.isArray(post.attachments)) {
        post.attachments.forEach((att) => {
          if (att.path) allMediaFiles.push({ name: att.name || att.path.split("/").pop(), path: att.path });
        });
      }
      let localMediaCounter = 0;
      allMediaFiles.forEach((fileObj) => {
        appState.globalMediaCounter++;
        localMediaCounter++;
        const fileExt = fileObj.name.includes(".") ? fileObj.name.split(".").pop() : "";
        const baseName = fileObj.name.substring(0, fileObj.name.length - (fileExt ? fileExt.length + 1 : 0));
        const fileIndex = String(localMediaCounter).padStart(3, "0");
        const globalFileIndex = String(appState.globalMediaCounter).padStart(3, "0");
        const pathData = {
          file_index: fileIndex,
          global_file_index: globalFileIndex,
          file_name: sanitizeFilename(baseName) + (fileExt ? "." + fileExt : ""),
          original_file_name: sanitizeFilename(fileObj.name),
          file_ext: fileExt,
          bulk_post_index: options.bulk_post_index ? String(options.bulk_post_index).padStart(3, "0") : ""
        };
        const finalPath = generateFilePath(templateToUse, pathData, postDetails);
        files.push({ name: finalPath, data: resolveMediaUrl(fileObj.path, fileObj.name), source: "url", isMedia: true });
      });
      if (state.settings.savePostContentAsText && post.content) {
        const formattedContent = htmlToFormattedText(post.content);
        if (formattedContent) {
          const textFileName = generateFilePath(templateToUse, { file_index: "000", file_name: "content.txt" }, postDetails);
          files.push({ name: textFileName, data: formattedContent, source: "text" });
        }
      }
    } else if (isPostPage) {
      let localMediaCounter = 0;
      const mediaNodes = document.querySelectorAll(".post__files .post__thumbnail a, .post__attachments a.post__attachment-link");
      mediaNodes.forEach((node) => {
        var _a2;
        const href = node.getAttribute("href");
        if (!href) return;
        appState.globalMediaCounter++;
        localMediaCounter++;
        const originalName = node.getAttribute("download") || ((_a2 = href.split("/").pop()) == null ? void 0 : _a2.split("?")[0]) || "file";
        const fileExt = originalName.includes(".") ? originalName.split(".").pop() : "";
        const baseName = originalName.substring(0, originalName.length - (fileExt ? fileExt.length + 1 : 0));
        const pathData = {
          file_index: String(localMediaCounter).padStart(3, "0"),
          global_file_index: String(appState.globalMediaCounter).padStart(3, "0"),
          file_name: sanitizeFilename(baseName) + (fileExt ? "." + fileExt : ""),
          original_file_name: sanitizeFilename(originalName),
          file_ext: fileExt
        };
        const finalPath = generateFilePath(templateToUse, pathData, postDetails);
        files.push({ name: finalPath, data: getFullUrl(href), source: "url", isMedia: true });
      });
      if (state.settings.savePostContentAsText && postDetails.postContent) {
        const textFileName = generateFilePath(templateToUse, { file_index: "000", file_name: "content.txt" }, postDetails);
        files.push({ name: textFileName, data: postDetails.postContent, source: "text" });
      }
    }
    if (state.settings.addMetadataFile && isApiSuccess && postDetails.rawApiData) {
      const metaPath = generateFilePath(templateToUse, { file_index: "meta", file_name: "metadata.json" }, postDetails);
      files.push({ name: metaPath, data: JSON.stringify(postDetails.rawApiData, null, 2), source: "text" });
    }
    if (state.settings.savePostTags && isPostPage) {
      try {
        const tagsUrl = getApiUrl(`/api/v1/${postDetails.service}/user/${postDetails.userID}/tags`);
        const tagsRes = await gmXmlhttpRequestWithRetries({ method: "GET", url: tagsUrl, responseType: "json" });
        if (Array.isArray(tagsRes.response) && tagsRes.response.length > 0) {
          const tagsPath = generateFilePath(templateToUse, { file_index: "tags", file_name: "tags.txt" }, postDetails);
          files.push({ name: tagsPath, data: tagsRes.response.join("\n"), source: "text" });
        }
      } catch (e) {
        debugLog("Failed to fetch tags", e);
      }
    }
    if (state.settings.savePostComments && isPostPage) {
      try {
        const commentsUrl = getApiUrl(`/api/v1/${postDetails.service}/user/${postDetails.userID}/post/${postDetails.postID}/comments`);
        const commentsRes = await gmXmlhttpRequestWithRetries({ method: "GET", url: commentsUrl, responseType: "json" });
        if (Array.isArray(commentsRes.response) && commentsRes.response.length > 0) {
          const commentsText = commentsRes.response.map((c) => `[${c.published || "N/A"}] ${c.commenter_name || "User"}: ${c.content}`).join("\n\n");
          const commentsPath = generateFilePath(templateToUse, { file_index: "comments", file_name: "comments.txt" }, postDetails);
          files.push({ name: commentsPath, data: commentsText, source: "text" });
        }
      } catch (e) {
        debugLog("Failed to fetch comments", e);
      }
    }
    return { files, postDate: postDetails.postDate || "UnknownDate" };
  }
  async function fetchAndCachePostData() {
    const postDetails = getPostDetailsFromPage();
    if (postDetails.service === "unknown") return;
    try {
      const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      appState.cachedPostFiles = files;
      debugLog(`Cached ${files.length} files for post ${postDetails.postID}`);
    } catch (err) {
      console.error("Failed to pre-cache post files:", err);
    }
  }
  class ProgressManager {
    constructor() {
      __publicField(this, "container", null);
      __publicField(this, "tasks", /* @__PURE__ */ new Map());
    }
    getContainer() {
      if (!this.container || !document.body.contains(this.container)) {
        this.container = getOrCreateContainer("kdl-progress-container");
      }
      return this.container;
    }
    createTask(id, titleText) {
      const container = this.getContainer();
      if (this.tasks.has(id)) {
        const existing = this.tasks.get(id);
        existing.updateStatus("Restarting task...");
        return existing;
      }
      const title = el("div", { className: "kdl-task-title" }, [titleText]);
      const status = el("div", { className: "kdl-task-status" }, ["Initializing..."]);
      const header = el("div", { className: "kdl-task-header" }, [title, status]);
      const filesContainer = el("div", { className: "kdl-task-files" });
      const taskElement = el("div", { className: "kdl-progress-task", id: `task-${id}` }, [header, filesContainer]);
      container.appendChild(taskElement);
      const task = {
        id,
        element: taskElement,
        statusElement: status,
        filesContainer,
        files: /* @__PURE__ */ new Map(),
        updateStatus: (text) => {
          status.textContent = text;
        },
        addFile: (fileId, fileName) => {
          if (task.files.has(fileId)) return;
          const label = el("div", { className: "kdl-progress-bar-label" }, [fileName]);
          const barInner = el("div", { className: "kdl-progress-bar-inner" });
          const bar = el("div", { className: "kdl-progress-bar" }, [barInner]);
          const wrapper = el("div", { className: "kdl-progress-bar-wrapper" }, [label, bar]);
          filesContainer.appendChild(wrapper);
          filesContainer.scrollTop = filesContainer.scrollHeight;
          task.files.set(fileId, { wrapper, barInner, label });
        },
        updateFileProgress: (fileId, percent) => {
          const file = task.files.get(fileId);
          if (file) {
            file.barInner.style.width = `${Math.min(100, Math.max(0, percent))}%`;
          }
        },
        markFileComplete: (fileId, success) => {
          const file = task.files.get(fileId);
          if (file) {
            file.barInner.style.width = "100%";
            file.barInner.classList.add(success ? "kdl-success" : "kdl-error");
            file.label.classList.add(success ? "kdl-success" : "kdl-error");
          }
        },
        finish: (autoRemoveDelay = 5e3) => {
          setTimeout(() => {
            taskElement.remove();
            this.tasks.delete(id);
          }, autoRemoveDelay);
        }
      };
      this.tasks.set(id, task);
      return task;
    }
  }
  const progressManager = new ProgressManager();
  function addTaskToQueue(type, action, postDetails, buttonElement, originalButtonText) {
    const origText = originalButtonText || (buttonElement ? buttonElement.textContent || "" : "");
    appState.downloadQueue.push({ type, action, postDetails, buttonElement, originalButtonText: origText });
    if (buttonElement) {
      buttonElement.dataset.isQueued = "true";
      buttonElement.textContent = "Queued...";
      buttonElement.disabled = true;
    }
    updateQueueIndicator();
    processQueue();
  }
  async function processQueue() {
    await getSettings();
    if (appState.isQueueProcessing || appState.downloadQueue.length === 0) return;
    if (appState.activeOperations >= state.settings.maxConcurrentOperations) return;
    appState.isQueueProcessing = true;
    while (appState.downloadQueue.length > 0 && appState.activeOperations < state.settings.maxConcurrentOperations) {
      const task = appState.downloadQueue.shift();
      appState.activeOperations++;
      updateQueueIndicator();
      if (task.buttonElement) {
        delete task.buttonElement.dataset.isQueued;
        task.buttonElement.dataset.isDownloading = "true";
        task.buttonElement.textContent = "Processing...";
      }
      (async () => {
        try {
          await task.action(task.postDetails);
        } catch (error) {
          console.error(`Task ${task.type} failed for post ${task.postDetails.postID}:`, error);
        } finally {
          if (task.buttonElement) {
            delete task.buttonElement.dataset.isDownloading;
            task.buttonElement.textContent = task.originalButtonText;
            task.buttonElement.disabled = false;
          }
          appState.activeOperations--;
          updateQueueIndicator();
          processQueue();
        }
      })();
    }
    appState.isQueueProcessing = false;
  }
  async function executeZipDownload(postDetails) {
    const task = progressManager.createTask(`zip-${postDetails.postID}`, `ZIP: ${postDetails.postTitle}`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      if (files.length === 0) throw new Error("No content to ZIP.");
      let successCount = 0;
      let failCount = 0;
      const urlFiles = files.filter((t) => t.source === "url");
      const totalUrlFiles = urlFiles.length;
      task.updateStatus(`Downloading ${totalUrlFiles} files...`);
      const zip = new JSZip();
      files.forEach((file) => {
        if (file.source === "text") zip.file(file.name, file.data);
      });
      const concurrency = Math.max(1, state.settings.maxConcurrentFileDownloadsInZip || 3);
      let queueIndex = 0;
      async function downloadWorker() {
        while (queueIndex < totalUrlFiles) {
          const i = queueIndex++;
          const file = urlFiles[i];
          const fileTaskId = `${postDetails.postID}-${i}`;
          task.addFile(fileTaskId, file.name);
          try {
            const response = await gmXmlhttpRequestWithRetries({
              method: "GET",
              url: file.data,
              responseType: "arraybuffer",
              timeout: state.settings.zipFileDownloadTimeout,
              onprogress: (e) => {
                if (e.lengthComputable && e.total > 0) {
                  task.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                }
              }
            });
            zip.file(file.name, response.response);
            task.markFileComplete(fileTaskId, true);
          } catch (error) {
            failCount++;
            console.error(`[Kemono DL Error] File download failed for URL "${file.data}":`, error);
            task.markFileComplete(fileTaskId, false);
            const sanitizedBase = sanitizeFilename(file.name.split("/").pop() || "file");
            zip.file(
              `failed_${sanitizedBase}`,
              `Failed to download file.
URL: ${file.data}
Error: ${(error == null ? void 0 : error.message) || error}`
            );
          } finally {
            successCount++;
            task.updateStatus(`Downloading... ${successCount}/${totalUrlFiles} done`);
          }
        }
      }
      const workers = Array.from({ length: Math.min(concurrency, totalUrlFiles) }, () => downloadWorker());
      await Promise.all(workers);
      if (totalUrlFiles > 0 && failCount === totalUrlFiles) {
        throw new Error("All file downloads failed");
      }
      task.updateStatus("Zipping...");
      const zipName = sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`);
      const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
        task.updateStatus(`Zipping ${meta.percent.toFixed(0)}%`);
      });
      if (!blob || blob.size === 0) throw new Error("Generated ZIP is empty.");
      const blobUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = zipName;
      downloadAnchor.style.display = "none";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3e4);
      task.updateStatus(`Complete! ${failCount > 0 ? `(${failCount} fails)` : ""}`);
    } catch (error) {
      task.updateStatus(`Error: ${error.message}`);
      console.error("ZIP process error:", error);
      throw error;
    } finally {
      task.finish();
    }
  }
  async function executeIndividualDownload(type, postDetails) {
    await getSettings();
    const task = progressManager.createTask(`indiv-${type}-${postDetails.postID}`, `${type}: ${postDetails.postTitle}`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const targetFiles = files.filter((f) => f.source === "url" && (type === "Images" ? f.isMedia : !f.isMedia));
      if (targetFiles.length === 0) {
        task.updateStatus(`No ${type.toLowerCase()} to download.`);
        task.finish(3e3);
        return;
      }
      task.updateStatus(`Starting download of ${targetFiles.length} files...`);
      for (let i = 0; i < targetFiles.length; i++) {
        const file = targetFiles[i];
        const fileTaskId = `indiv-${i}`;
        task.addFile(fileTaskId, file.name);
        while (appState.activeOperations >= state.settings.maxConcurrentIndividualDownloads) {
          await new Promise((res) => setTimeout(res, 200));
        }
        GM_download({
          url: file.data,
          name: file.name,
          saveAs: false
        });
        task.markFileComplete(fileTaskId, true);
        task.updateStatus(`Triggered ${i + 1}/${targetFiles.length}`);
      }
      task.updateStatus("All downloads triggered!");
    } catch (error) {
      task.updateStatus(`Error: ${error.message}`);
    } finally {
      task.finish();
    }
  }
  async function downloadPostAsZip(details) {
    const postTask = progressManager.createTask(`zip-multi-${details.postID}`, `ZIP: ${details.postTitle}`);
    try {
      const { files } = await collectFilesForPost(details, {
        isBulk: false,
        template: "{file_index}_{file_name}"
      });
      if (files.length === 0) throw new Error("No content to ZIP.");
      const zip = new JSZip();
      let failedFileCount = 0;
      const urlFiles = files.filter((f) => f.source === "url");
      postTask.updateStatus(`Downloading ${urlFiles.length} files...`);
      files.forEach((file) => {
        if (file.source === "text") zip.file(file.name, file.data);
      });
      const downloadPromises = [];
      let activeFileDownloads = 0;
      for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
        const fileToDownload = urlFiles[fileIndex];
        downloadPromises.push(
          (async () => {
            while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
            activeFileDownloads++;
            const fileTaskId = `multi-${details.postID}-${fileIndex}`;
            postTask.addFile(fileTaskId, fileToDownload.name);
            try {
              const response = await gmXmlhttpRequestWithRetries({
                method: "GET",
                url: fileToDownload.data,
                responseType: "arraybuffer",
                timeout: state.settings.zipFileDownloadTimeout,
                onprogress: (e) => {
                  if (e.lengthComputable) postTask.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                }
              });
              zip.file(fileToDownload.name, response.response);
              postTask.markFileComplete(fileTaskId, true);
            } catch (error) {
              failedFileCount++;
              postTask.markFileComplete(fileTaskId, false);
            } finally {
              activeFileDownloads--;
            }
          })()
        );
      }
      await Promise.all(downloadPromises);
      postTask.updateStatus("Zipping...");
      const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
        author_name: details.authorName,
        post_title: details.postTitle,
        post_id: details.postID,
        user_id: details.userID,
        service: details.service,
        post_date: details.postDate || "UnknownDate"
      });
      const blob = await zip.generateAsync({ type: "blob" });
      GM_download({ url: URL.createObjectURL(blob), name: zipFileName, saveAs: false });
      postTask.updateStatus(`Complete! ${failedFileCount > 0 ? `(${failedFileCount} fails)` : ""}`);
    } catch (error) {
      console.error(`Failed to download post ${details.postID} as ZIP:`, error);
      postTask.updateStatus(`Error: ${error.message}`);
      throw error;
    } finally {
      postTask.finish();
    }
  }
  async function executeBulkDownloadSingle(postIds, authorName) {
    var _a;
    const task = progressManager.createTask(`bulk-single-${Date.now()}`, `Bulk Archive (${postIds.length} Posts)`);
    resetMediaCounter();
    try {
      const zip = new JSZip();
      let htmlIndexString = "";
      if (state.settings.addHtmlIndexInZip) {
        htmlIndexString = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${sanitizeFilename(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${sanitizeFilename(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>`;
      }
      for (let i = 0; i < postIds.length; i++) {
        const postId = postIds[i];
        const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
        if (!postCard) continue;
        const postDetails = getPostCardDetails(postCard, authorName);
        task.updateStatus(`[${i + 1}/${postIds.length}] Fetching: ${postDetails.postTitle}`);
        const { files } = await collectFilesForPost(postDetails, {
          isBulk: true,
          bulk_post_index: i + 1,
          template: state.settings.bulkSingleInternalPathTemplate
        });
        if (state.settings.addHtmlIndexInZip) {
          const postLink = ((_a = postCard.querySelector("a")) == null ? void 0 : _a.href) || "#";
          htmlIndexString += `<div class="post-entry">h2><a href="${postLink}" target="_blank">[${postDetails.postDate || "N/A"}] ${postDetails.postTitle}</a></h2><ul>`;
          if (files.length > 0) {
            files.forEach((file) => {
              const sanitizedPath = file.name.split("/").map((part) => encodeURIComponent(part)).join("/");
              htmlIndexString += `<li><a href="./${sanitizedPath}">${file.name.split("/").pop()}</a></li>`;
            });
          } else {
            htmlIndexString += `<li>No files found.</li>`;
          }
          htmlIndexString += `</ul></div>`;
        }
        if (files.length === 0) continue;
        files.forEach((file) => {
          if (file.source === "text") zip.file(file.name, file.data);
        });
        const urlFiles = files.filter((f) => f.source === "url");
        if (urlFiles.length > 0) {
          task.updateStatus(`[${i + 1}/${postIds.length}] Downloading ${urlFiles.length} files for ${postDetails.postTitle}`);
          const downloadPromises = [];
          let activeFileDownloads = 0;
          for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
            const fileToDownload = urlFiles[fileIndex];
            downloadPromises.push(
              (async () => {
                while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
                  await new Promise((resolve) => setTimeout(resolve, 200));
                }
                activeFileDownloads++;
                const fileTaskId = `bulk-${i}-${fileIndex}`;
                task.addFile(fileTaskId, fileToDownload.name);
                try {
                  const response = await gmXmlhttpRequestWithRetries({
                    method: "GET",
                    url: fileToDownload.data,
                    responseType: "arraybuffer",
                    timeout: state.settings.zipFileDownloadTimeout,
                    onprogress: (e) => {
                      if (e.lengthComputable) task.updateFileProgress(fileTaskId, e.loaded / e.total * 100);
                    }
                  });
                  zip.file(fileToDownload.name, response.response);
                  task.markFileComplete(fileTaskId, true);
                } catch (error) {
                  task.markFileComplete(fileTaskId, false);
                  zip.file(
                    `failed_${fileToDownload.name.split("/").pop()}`,
                    `Failed to download.
URL: ${fileToDownload.data}
Error: ${error.message}`
                  );
                } finally {
                  activeFileDownloads--;
                }
              })()
            );
          }
          await Promise.all(downloadPromises);
        }
      }
      if (state.settings.addHtmlIndexInZip) {
        htmlIndexString += `</div></body></html>`;
        zip.file("_index.html", htmlIndexString);
      }
      task.updateStatus(`Zipping ${postIds.length} Posts...`);
      const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
        author_name: authorName,
        post_count: postIds.length
      });
      const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
        task.updateStatus(`Generating final ZIP: ${meta.percent.toFixed(0)}%`);
      });
      GM_download({ url: URL.createObjectURL(blob), name: finalZipName, saveAs: false });
      task.updateStatus("Complete!");
    } catch (error) {
      console.error("Bulk download (single) failed:", error);
      task.updateStatus(`Error: ${error.message}`);
    } finally {
      task.finish();
    }
  }
  async function executeBulkDownloadMultiple(postIds, authorName) {
    const task = progressManager.createTask(`bulk-multiple-${Date.now()}`, `Bulk Queuing (${postIds.length} Posts)`);
    task.updateStatus("Adding posts to the download queue...");
    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];
      const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
      if (!postCard) continue;
      const postDetails = getPostCardDetails(postCard, authorName);
      const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
      postDetails.postDate = postDate;
      addTaskToQueue("Bulk-Single-Zip", downloadPostAsZip, postDetails, null);
      task.updateStatus(`Queued ${i + 1}/${postIds.length} posts...`);
    }
    task.updateStatus("All posts queued! Downloads will start based on concurrency settings.");
    task.finish(3e3);
  }
  async function executeBulkDownload(postIdsOrEvent = null) {
    var _a, _b, _c;
    const downloadBtn = document.getElementById("kdl-bulk-download-btn");
    let postIdsToProcess;
    if (postIdsOrEvent instanceof Set && postIdsOrEvent.size > 0) {
      postIdsToProcess = postIdsOrEvent;
    } else {
      postIdsToProcess = appState.selectedPostIds;
    }
    if (postIdsToProcess.size === 0) {
      showMessage("No posts selected.", "warning");
      return;
    }
    if (downloadBtn) downloadBtn.disabled = true;
    updateQueueIndicator();
    const sortOrder = ((_a = document.getElementById("kdl-bulk-sort-order")) == null ? void 0 : _a.value) || "selection";
    let postIdsArray = Array.from(postIdsToProcess);
    if (sortOrder === "oldest") {
      postIdsArray.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    } else if (sortOrder === "newest") {
      postIdsArray.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }
    const authorName = ((_c = (_b = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _b.textContent) == null ? void 0 : _c.trim()) || "UnknownAuthor";
    await getSettings();
    try {
      if (state.settings.bulkDownloadMode === "multiple") {
        await executeBulkDownloadMultiple(postIdsArray, authorName);
      } else {
        await executeBulkDownloadSingle(postIdsArray, authorName);
      }
    } catch (error) {
      console.error("Bulk download execution failed:", error);
      showMessage("A critical error occurred during bulk download.", "error");
    } finally {
      if (downloadBtn) downloadBtn.disabled = false;
      document.querySelectorAll(".kdl-post-checkbox:checked").forEach((cb) => {
        if (postIdsToProcess.has(cb.dataset.id)) cb.checked = false;
      });
      const bulkBtnOnPage = document.getElementById("kdl-bulk-download-btn");
      if (bulkBtnOnPage) {
        appState.selectedPostIds.clear();
        bulkBtnOnPage.textContent = `Download Selected (0)`;
        bulkBtnOnPage.disabled = true;
      }
      updateQueueIndicator();
    }
  }
  async function executeLinkAction(actionType, postDetails, buttonEl, originalText) {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    const urlFiles = files.filter((f) => f.source === "url");
    if (urlFiles.length === 0) {
      showMessage("No download links found for this post.", "warning");
      return;
    }
    if (actionType === "copy-aria") {
      const textToCopy = urlFiles.map((f) => `${f.data}
  out=${f.name}`).join("\n");
      GM_setClipboard(textToCopy);
      showMessage(`Copied ${urlFiles.length} links formatted for aria2c/IDM!`, "info");
    } else if (actionType === "download-txt") {
      const textContent = urlFiles.map((f) => f.data).join("\n");
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const fileName = `${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_links.txt`;
      GM_download({
        url: URL.createObjectURL(blob),
        name: fileName,
        saveAs: false
      });
      showMessage(`Downloaded ${urlFiles.length} links as text file for ADM!`, "info");
    } else if (actionType === "share") {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: postDetails.postTitle,
            text: `Download links for ${postDetails.postTitle} by ${postDetails.authorName}:
` + urlFiles.map((f) => f.data).join("\n")
          });
          showMessage("Links shared successfully!", "info");
        } catch (err) {
          debugLog("Share cancelled or failed:", err);
        }
      } else {
        showMessage("Web Share API is not supported in this browser.", "warning");
      }
    }
  }
  async function executeTranslation(button) {
    await getSettings();
    const provider = state.settings.translationProvider;
    if (provider === "none") {
      showMessage('Translation provider is set to "None" in settings.', "warning");
      return;
    }
    const postContentNode = document.querySelector(".post__content");
    if (!postContentNode) {
      showMessage("Post content not found to translate.", "warning");
      return;
    }
    if (!appState.originalPostContentHTML) {
      appState.originalPostContentHTML = postContentNode.innerHTML;
    }
    const isTranslated = button.dataset.isTranslated === "true";
    if (isTranslated) {
      postContentNode.innerHTML = appState.originalPostContentHTML;
      button.dataset.isTranslated = "false";
      button.textContent = "Translate 📝";
      return;
    }
    const originalText = postContentNode.innerText.trim();
    if (!originalText) {
      showMessage("No text content found to translate.", "info");
      return;
    }
    if (appState.translationCache[originalText]) {
      postContentNode.innerText = appState.translationCache[originalText];
      button.dataset.isTranslated = "true";
      button.textContent = "Show Original ↩️";
      return;
    }
    button.textContent = "Translating... ⏳";
    button.disabled = true;
    try {
      let translatedText = "";
      if (provider === "gemini") {
        translatedText = await executeGeminiTranslation(originalText);
      } else if (provider === "deepl") {
        translatedText = await executeDeepLTranslation(originalText);
      } else {
        throw new Error(`Provider ${provider} is not supported yet.`);
      }
      if (translatedText) {
        appState.translationCache[originalText] = translatedText;
        postContentNode.innerText = translatedText;
        button.dataset.isTranslated = "true";
        button.textContent = "Show Original ↩️";
      }
    } catch (error) {
      console.error("Translation error:", error);
      showMessage(`Translation failed: ${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  }
  async function executeGeminiTranslation(text) {
    var _a, _b, _c, _d, _e;
    const apiKey = state.settings.geminiApiKey;
    if (!apiKey) throw new Error("Gemini API key is missing in settings.");
    const model = state.settings.translationModelName || "gemini-1.5-flash-latest";
    const targetLang = state.settings.translationLanguage || "Russian";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = `Translate the following content into ${targetLang}. Preserve line breaks and formatting. Do not add conversational commentary:

${text}`;
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      responseType: "json"
    });
    const candidates = (_a = response.response) == null ? void 0 : _a.candidates;
    if (candidates && ((_e = (_d = (_c = (_b = candidates[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) {
      return candidates[0].content.parts[0].text.trim();
    }
    throw new Error("Invalid response structure from Gemini API");
  }
  async function executeDeepLTranslation(text) {
    var _a, _b;
    const apiKey = state.settings.deeplApiKey;
    if (!apiKey) throw new Error("DeepL API key is missing in settings.");
    const tier = state.settings.deeplApiTier || "free";
    const baseUrl = tier === "pro" ? "https://api.deepl.com" : "https://api-free.deepl.com";
    const targetLang = (state.settings.translationLanguage || "RU").substring(0, 2).toUpperCase();
    const response = await gmXmlhttpRequestWithRetries({
      method: "POST",
      url: `${baseUrl}/v2/translate`,
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ text: [text], target_lang: targetLang }),
      responseType: "json"
    });
    const translations = (_a = response.response) == null ? void 0 : _a.translations;
    if (translations && ((_b = translations[0]) == null ? void 0 : _b.text)) {
      return translations[0].text.trim();
    }
    throw new Error("Invalid response structure from DeepL API");
  }
  async function createAndInsertPostPageButtons(container, referenceElement) {
    await getSettings();
    document.querySelectorAll(".kdl-button").forEach((node) => node.remove());
    const postDetails = getPostDetailsFromPage();
    const fragment = document.createDocumentFragment();
    const createButton = (text, title, bgColor, onClick, onContext) => {
      return el(
        "button",
        {
          className: "kdl-button",
          title,
          style: {
            padding: "8px 12px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9em",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            backgroundColor: bgColor
          },
          onClick,
          onContextMenu: onContext
        },
        [text]
      );
    };
    if (state.settings.showTranslateButton && state.settings.translationProvider !== "none" && (state.settings.geminiApiKey || state.settings.deeplApiKey)) {
      fragment.appendChild(createButton("Translate 📝", "Translate", "#5856d6", (e) => executeTranslation(e.target)));
    }
    if (state.settings.showCopyLinksButton) {
      const btn = createButton(
        "Copy Links",
        "Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.",
        "#17a2b8",
        (e) => executeLinkAction("copy-aria", postDetails, e.target),
        (e) => {
          e.preventDefault();
          executeLinkAction("download-txt", postDetails, e.target);
        }
      );
      fragment.appendChild(btn);
    }
    if (state.settings.showShareButton && typeof navigator.share === "function") {
      fragment.appendChild(
        createButton(
          "Share Links",
          "Share Links",
          "#6f42c1",
          (e) => executeLinkAction("share", postDetails, e.target)
        )
      );
    }
    if (state.settings.showImagesButton) {
      fragment.appendChild(
        createButton(
          "Download Images",
          "Download Images",
          "#007bff",
          (e) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), postDetails, e.target, "Download Images")
        )
      );
    }
    if (state.settings.showFilesButton) {
      const btn = createButton(
        "Download Attachments",
        "Download Attachments",
        "#ffc107",
        (e) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), postDetails, e.target, "Download Attachments")
      );
      btn.style.color = "#212529";
      fragment.appendChild(btn);
    }
    if (state.settings.showZipButton) {
      fragment.appendChild(
        createButton(
          "Download (ZIP)",
          "Download (ZIP)",
          "#28a745",
          (e) => addTaskToQueue("ZIP", executeZipDownload, postDetails, e.target, "Download (ZIP)")
        )
      );
    }
    container.insertBefore(fragment, referenceElement ? referenceElement.nextSibling : container.firstChild);
  }
  async function showFilePickerModal(postDetails) {
    const overlay = el("div", {
      id: "kdl-file-picker-overlay",
      onClick: (e) => {
        if (e.target === overlay) overlay.remove();
      }
    });
    const modal = el("div", { id: "kdl-file-picker-modal" }, [el("h4", {}, ["Loading attachments..."])]);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    try {
      const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const attachments = files.filter((t) => !t.isMedia && t.source === "url");
      if (attachments.length === 0) {
        modal.innerHTML = "<h4>No attachments found for this post.</h4>";
        return;
      }
      modal.innerHTML = '<h4>Select an attachment to download</h4><ul id="kdl-file-picker-list"></ul>';
      const list = modal.querySelector("#kdl-file-picker-list");
      attachments.forEach((file) => {
        const li = el("li");
        const a = el("a", { href: "#", dataset: { url: file.data, name: file.name } }, [file.name.split("/").pop()]);
        li.appendChild(a);
        list.appendChild(li);
      });
      list.addEventListener("click", (e) => {
        e.preventDefault();
        const link = e.target.closest("a");
        if (link) {
          const fileName = link.dataset.name.split("/").pop();
          showMessage(`Starting download for ${fileName}`, "info");
          GM_download({ url: link.dataset.url, name: link.dataset.name, saveAs: false });
          overlay.remove();
        }
      });
    } catch (error) {
      modal.innerHTML = `<h4>Failed to load attachments.</h4><p style="color:#ccc;font-size:0.9em;">${error.message}</p>`;
    }
  }
  async function injectPostCardButtons(postCardNode, pageAuthorName) {
    await getSettings();
    if (postCardNode.querySelector(".post-card-download-controls")) return;
    const details = getPostCardDetails(postCardNode, pageAuthorName);
    if (details.postID === "UnknownPostID") return;
    const controlsContainer = el("div", { className: "post-card-download-controls" });
    const createMiniBtn = (text, title, cls, onClick) => {
      controlsContainer.appendChild(
        el(
          "button",
          {
            className: cls,
            title,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(e.target);
            }
          },
          [text]
        )
      );
    };
    if (state.settings.showZipButton) createMiniBtn("ZIP", "Download ZIP", "post-card-dl-zip", (btn) => addTaskToQueue("ZIP", executeZipDownload, details, btn, "ZIP"));
    if (state.settings.showImagesButton) createMiniBtn("Imgs", "Download Images", "post-card-dl-img", (btn) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), details, btn, "Imgs"));
    if (state.settings.showFilesButton) {
      createMiniBtn("Attach.", "Download Attachments", "post-card-dl-att", (btn) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), details, btn, "Attach."));
      createMiniBtn("📎", "Pick & Download Attachment", "post-card-dl-pick", () => showFilePickerModal(details));
    }
    if (controlsContainer.hasChildNodes()) {
      const tooltip = el("div", { className: "kdl-post-info-tooltip" });
      postCardNode.appendChild(tooltip);
      let isFetching = false;
      const infoBtn = el("button", { className: "post-card-dl-info", title: "Show post info" }, ["ℹ️"]);
      infoBtn.addEventListener("mouseover", async () => {
        tooltip.style.display = "block";
        if (postCardNode.dataset.postInfo) {
          tooltip.innerHTML = postCardNode.dataset.postInfo;
          return;
        }
        if (isFetching) return;
        isFetching = true;
        tooltip.innerHTML = "<em>Loading...</em>";
        try {
          const apiResponse = await fetchPostDataFromAPI(details.service, details.userID, details.postID);
          const post = (apiResponse == null ? void 0 : apiResponse.post) || (Array.isArray(apiResponse) ? apiResponse[0] : apiResponse);
          if (!post) throw new Error("No post data");
          const fileCount = post.file ? 1 : 0;
          const attachmentCount = post.attachments ? post.attachments.length : 0;
          const totalFiles = fileCount + attachmentCount;
          const infoHTML = `<b>Title:</b> ${post.title}<br><b>Published:</b> ${new Date(post.published).toLocaleDateString()}<br><b>Total Files:</b> ${totalFiles}<br><em>(${attachmentCount} attachments, ${fileCount} main file)</em>`;
          tooltip.innerHTML = infoHTML;
          postCardNode.dataset.postInfo = infoHTML;
        } catch (err) {
          tooltip.innerHTML = "<em>Failed to load info.</em>";
        } finally {
          isFetching = false;
        }
      });
      infoBtn.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
      });
      controlsContainer.appendChild(infoBtn);
      postCardNode.appendChild(controlsContainer);
    }
  }
  function updateCardFavoriteState(card, isFavorited, type) {
    var _a, _b, _c, _d;
    if (!card) return;
    const favBtn = card.querySelector(".kdl-quick-fav-btn");
    if (isFavorited) {
      if (favBtn) favBtn.classList.add("kdl-favorited");
      if (type === "creator") card.classList.add("user-card--fav");
      else {
        (_a = card.querySelector(".post-card__header")) == null ? void 0 : _a.classList.add("post-card__header--fav");
        (_b = card.querySelector(".post-card__footer")) == null ? void 0 : _b.classList.add("post-card__footer--fav");
      }
    } else {
      if (favBtn) favBtn.classList.remove("kdl-favorited");
      if (type === "creator") card.classList.remove("user-card--fav");
      else {
        (_c = card.querySelector(".post-card__header")) == null ? void 0 : _c.classList.remove("post-card__header--fav");
        (_d = card.querySelector(".post-card__footer")) == null ? void 0 : _d.classList.remove("post-card__footer--fav");
      }
    }
  }
  function injectArtistFavoriteButton(cardNode) {
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const service = cardNode.dataset.service;
    const creatorId = cardNode.dataset.id;
    if (!service || !creatorId) return;
    const isFavorited = appState.favoritedArtists.has(`${service}-${creatorId}`);
    const favBtn = document.createElement("button");
    favBtn.className = "kdl-quick-fav-btn";
    favBtn.innerHTML = "⭐";
    favBtn.title = "Toggle Favorite";
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "creator");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn, "creator", service, creatorId, null, updateCardFavoriteState);
    });
  }
  function injectPostFavoriteButton(cardNode) {
    if (cardNode.querySelector(".kdl-quick-fav-btn")) return;
    const service = cardNode.dataset.service;
    const creatorId = cardNode.dataset.user;
    const postId = cardNode.dataset.id;
    if (!service || !creatorId || !postId) return;
    const isFavorited = appState.favoritedPosts.has(postId);
    const favBtn = document.createElement("button");
    favBtn.className = "kdl-quick-fav-btn";
    favBtn.innerHTML = "⭐";
    favBtn.title = "Toggle Favorite";
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "post");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn, "post", service, creatorId, postId, updateCardFavoriteState);
    });
  }
  let lastCheckedIndex = null;
  function initializeShiftClickLogic() {
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    if (postCards.length === 0) return;
    const updateSelectionState = () => {
      appState.selectedPostIds.clear();
      postCards.forEach((card) => {
        const checkbox = card.querySelector(".kdl-post-checkbox");
        if (checkbox && checkbox.checked) {
          appState.selectedPostIds.add(checkbox.dataset.id);
        }
      });
      const btn = document.getElementById("kdl-bulk-download-btn");
      if (btn) {
        btn.textContent = `Download Selected (${appState.selectedPostIds.size})`;
        btn.disabled = appState.selectedPostIds.size === 0;
      }
    };
    postCards.forEach((card, index) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (!checkbox) return;
      checkbox.addEventListener("click", (event) => {
        if (event.shiftKey && lastCheckedIndex !== null) {
          const start = Math.min(index, lastCheckedIndex);
          const end = Math.max(index, lastCheckedIndex);
          const isChecked = postCards[lastCheckedIndex].querySelector(".kdl-post-checkbox").checked;
          for (let i = start; i <= end; i++) {
            const cb = postCards[i].querySelector(".kdl-post-checkbox");
            if (cb) cb.checked = isChecked;
          }
        }
        lastCheckedIndex = index;
        updateSelectionState();
      });
    });
    const pagination = document.querySelector(".paginator");
    if (pagination) {
      pagination.addEventListener("click", () => {
        lastCheckedIndex = null;
      });
    }
  }
  function createBulkDownloadPanel() {
    if (document.getElementById("kdl-bulk-panel")) return;
    const cardList = document.querySelector(".card-list");
    if (!cardList) return;
    const panel = el("div", { id: "kdl-bulk-panel" }, [
      el(
        "button",
        {
          id: "kdl-bulk-select-all",
          onClick: () => document.querySelectorAll("article.post-card[data-id] .kdl-post-checkbox:not(:checked)").forEach((cb) => cb.click())
        },
        ["Select All"]
      ),
      el(
        "button",
        {
          id: "kdl-bulk-deselect-all",
          onClick: () => document.querySelectorAll("article.post-card[data-id] .kdl-post-checkbox:checked").forEach((cb) => cb.click())
        },
        ["Deselect All"]
      ),
      el("label", { style: { color: "#fff", fontSize: "0.9em" } }, ["Order: "]),
      el(
        "select",
        {
          id: "kdl-bulk-sort-order",
          style: { backgroundColor: "#444", color: "#fff", border: "1px solid #555", borderRadius: "4px", padding: "4px" }
        },
        [
          el("option", { value: "selection" }, ["By Selection"]),
          el("option", { value: "oldest" }, ["Oldest First"]),
          el("option", { value: "newest" }, ["Newest First"])
        ]
      ),
      el("button", { id: "kdl-bulk-download-btn", disabled: true, onClick: () => executeBulkDownload() }, ["Download Selected (0)"])
    ]);
    cardList.parentElement.insertBefore(panel, cardList);
  }
  async function launchAuthorManager(forceRefresh = false) {
    var _a, _b;
    let overlay = document.getElementById("kdl-author-manager-overlay");
    if (!overlay) {
      overlay = el("div", { id: "kdl-author-manager-overlay" });
      overlay.innerHTML = `
      <div id="kdl-author-manager-modal">
        <div id="kdl-manager-header"><h3 id="kdl-manager-title"></h3><em id="kdl-manager-cache-status" style="font-size: 0.8em; color: #aaa; margin-left: 10px;"></em></div>
        <div id="kdl-manager-controls" style="flex-wrap: wrap;">
            <button id="kdl-manager-refresh" class="kdl-manager-btn" title="Force Refresh" style="background-color: #17a2b8;">🔄</button>
            <input type="text" id="kdl-manager-search" placeholder="Search by title...">
            <select id="kdl-manager-sort" class="kdl-manager-btn" style="padding: 8px 6px;">
                <option value="date-desc">Newest First</option><option value="date-asc">Oldest First</option>
                <option value="files-desc">Most Files</option><option value="files-asc">Fewest Files</option>
                <option value="title-asc">Title (A-Z)</option><option value="title-desc">Title (Z-A)</option>
            </select>
            <button id="kdl-manager-select-all" class="kdl-manager-btn" style="background-color: #007bff;">Select Visible</button>
            <button id="kdl-manager-deselect-all" class="kdl-manager-btn" style="background-color: #dc3545;">Deselect All</button>
        </div>
        <div id="kdl-manager-post-list"></div>
        <div id="kdl-manager-footer">
            <span id="kdl-manager-counter">Selected: 0</span>
            <div>
                <button id="kdl-manager-download" class="kdl-manager-btn" style="background-color: #28a745;" disabled>Download Selected</button>
                <button id="kdl-manager-close" class="kdl-manager-btn" style="background-color: #6c757d;">Close</button>
            </div>
        </div>
      </div>
    `;
      document.body.appendChild(overlay);
      overlay.querySelector("#kdl-manager-close").addEventListener("click", () => overlay.style.display = "none");
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.style.display = "none";
      });
    }
    overlay.style.display = "flex";
    await getSettings();
    const listContainer = document.getElementById("kdl-manager-post-list");
    const title = document.getElementById("kdl-manager-title");
    const authorName = ((_b = (_a = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "UnknownAuthor";
    const pathParts = window.location.pathname.match(/\/([^/]+)\/user\/([^/]+)/);
    if (!pathParts) return;
    const service = pathParts[1];
    const userID = pathParts[2];
    const cacheKey = `kemono_posts_cache_${service}_${userID}`;
    if (!forceRefresh && state.settings.cacheDurationHours > 0) {
      const cachedData = await GM_getValue(cacheKey, null);
      if (cachedData && cachedData.postList) {
        const cacheAgeHours = (Date.now() - cachedData.timestamp) / (1e3 * 60 * 60);
        if (cacheAgeHours < state.settings.cacheDurationHours) {
          title.textContent = `Manage ${cachedData.postList.length} posts by ${authorName}`;
          populateManagerList(cachedData.postList);
          setupManagerEventListeners();
          return;
        }
      }
    }
    title.textContent = `Loading posts for: ${authorName}`;
    listContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Fetching all post data from API...</p>';
    const allPosts = await fetchAllAuthorPosts(service, userID);
    if (allPosts.length > 0) {
      if (state.settings.cacheDurationHours > 0) {
        await GM_setValue(cacheKey, { timestamp: Date.now(), postList: allPosts });
      }
      title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
      populateManagerList(allPosts);
      setupManagerEventListeners();
    } else {
      title.textContent = `Failed to load posts for ${authorName}`;
      listContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Could not retrieve post list.</p>';
    }
  }
  function populateManagerList(posts) {
    const listContainer = document.getElementById("kdl-manager-post-list");
    const fragment = document.createDocumentFragment();
    posts.forEach((post) => {
      var _a;
      const postDate = post.published ? new Date(post.published).toISOString().split("T")[0] : "No Date";
      const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);
      const item = el("div", {
        className: "post-item",
        dataset: {
          id: post.id,
          title: post.title.toLowerCase(),
          date: post.published || "0",
          files: String(fileCount)
        }
      });
      let previewHtml = '<div class="post-item-preview"></div>';
      if ((_a = post.file) == null ? void 0 : _a.path) {
        const pathParts = post.file.path.split("/").filter((p) => p);
        const fileName = pathParts.pop();
        const thumbUrl = getThumbnailUrl(`${pathParts.join("/")}/${fileName}`);
        previewHtml = `<img src="${thumbUrl}" class="post-item-preview" loading="lazy">`;
      }
      const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);
      item.innerHTML = `
      ${previewHtml}
      <input type="checkbox" data-id="${post.id}">
      <div class="post-item-label">
          <span class="post-item-title">${sanitizeFilename(post.title)}</span>
          <span class="post-item-date">${postDate} | Files: ${fileCount} | ID: ${post.id}</span>
      </div>
      <a href="${postUrl}" target="_blank" class="post-item-open-link" title="Open post in new tab">↗️</a>
    `;
      fragment.appendChild(item);
    });
    listContainer.innerHTML = "";
    listContainer.appendChild(fragment);
  }
  function setupManagerEventListeners() {
    const searchInput = document.getElementById("kdl-manager-search");
    const listContainer = document.getElementById("kdl-manager-post-list");
    const downloadBtn = document.getElementById("kdl-manager-download");
    const counter = document.getElementById("kdl-manager-counter");
    const getCheckboxes = () => Array.from(listContainer.querySelectorAll('input[type="checkbox"]'));
    const updateCounter = () => {
      const count = getCheckboxes().filter((cb) => cb.checked).length;
      counter.textContent = `Selected: ${count}`;
      downloadBtn.disabled = count === 0;
    };
    const applyFiltersAndSort = () => {
      const allItems = Array.from(listContainer.querySelectorAll(".post-item"));
      const searchTerm = searchInput.value.toLowerCase();
      const sortMethod = document.getElementById("kdl-manager-sort").value;
      let visibleItems = allItems.filter((item) => {
        const match = item.dataset.title.includes(searchTerm);
        item.style.display = match ? "flex" : "none";
        return match;
      });
      visibleItems.sort((a, b) => {
        switch (sortMethod) {
          case "date-asc":
            return a.dataset.date.localeCompare(b.dataset.date);
          case "files-desc":
            return parseInt(b.dataset.files, 10) - parseInt(a.dataset.files, 10);
          case "files-asc":
            return parseInt(a.dataset.files, 10) - parseInt(b.dataset.files, 10);
          case "title-asc":
            return a.dataset.title.localeCompare(b.dataset.title);
          case "title-desc":
            return b.dataset.title.localeCompare(a.dataset.title);
          default:
            return b.dataset.date.localeCompare(a.dataset.date);
        }
      });
      visibleItems.forEach((item) => listContainer.appendChild(item));
    };
    searchInput.addEventListener("input", applyFiltersAndSort);
    document.getElementById("kdl-manager-sort").addEventListener("change", applyFiltersAndSort);
    document.getElementById("kdl-manager-refresh").addEventListener("click", () => launchAuthorManager(true));
    document.getElementById("kdl-manager-select-all").addEventListener("click", () => {
      getCheckboxes().forEach((cb) => {
        if (cb.closest(".post-item").style.display !== "none") cb.checked = true;
      });
      updateCounter();
    });
    document.getElementById("kdl-manager-deselect-all").addEventListener("click", () => {
      getCheckboxes().forEach((cb) => {
        if (cb.closest(".post-item").style.display !== "none") cb.checked = false;
      });
      updateCounter();
    });
    let lastCheckedIndex2 = null;
    listContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest(".post-item-open-link")) return;
      const item = target.closest(".post-item");
      if (!item) return;
      const checkboxes = getCheckboxes();
      const checkbox = item.querySelector('input[type="checkbox"]');
      const currentIndex = checkboxes.indexOf(checkbox);
      if (target.tagName !== "INPUT") checkbox.checked = !checkbox.checked;
      if (e.shiftKey && lastCheckedIndex2 !== null) {
        const start = Math.min(currentIndex, lastCheckedIndex2);
        const end = Math.max(currentIndex, lastCheckedIndex2);
        const isChecked = checkboxes[lastCheckedIndex2].checked;
        for (let i = start; i <= end; i++) checkboxes[i].checked = isChecked;
      }
      lastCheckedIndex2 = currentIndex;
      updateCounter();
    });
    downloadBtn.addEventListener("click", () => {
      const selectedIds = /* @__PURE__ */ new Set();
      getCheckboxes().forEach((cb) => {
        if (cb.checked) selectedIds.add(cb.dataset.id);
      });
      if (selectedIds.size > 0) {
        document.getElementById("kdl-author-manager-overlay").style.display = "none";
        executeBulkDownload(selectedIds);
      }
    });
    updateCounter();
  }
  function createAuthorManagerButton() {
    let managerBtn = document.getElementById("kdl-author-manager-btn");
    if (managerBtn) return managerBtn;
    return el(
      "button",
      {
        id: "kdl-author-manager-btn",
        title: "Load all posts from this author into a powerful manager with search and bulk selection.",
        style: {
          backgroundColor: "#6f42c1",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "0 12px",
          height: "32px",
          fontSize: "14px",
          cursor: "pointer"
        },
        onClick: () => launchAuthorManager()
      },
      ["🗂️ Manage All Posts"]
    );
  }
  function injectStyles(css) {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
  }
  injectStyles(CSS_STYLES);
  let lastUrl = "";
  let isInitializing = false;
  async function handlePageContent() {
    var _a, _b;
    try {
      await getSettings();
      await fetchUserFavorites();
      appState.cachedPostFiles = null;
      appState.originalPostContentHTML = null;
      appState.selectedPostIds.clear();
      document.querySelectorAll(".kdl-button, .post-card-download-controls, #kdl-bulk-panel, .kdl-post-checkbox, #kdl-author-manager-btn, .kdl-quick-fav-btn").forEach((el2) => el2.remove());
      const path = window.location.pathname;
      if (path.includes("/post/")) {
        let header = document.querySelector(".post__header");
        let actionsDiv = document.querySelector(".post__actions");
        if (!actionsDiv && header) {
          actionsDiv = el("div", { className: "post__actions" });
          header.appendChild(actionsDiv);
        }
        if (actionsDiv) {
          const favButton = Array.from(actionsDiv.querySelectorAll("button, a")).find((b) => {
            var _a2;
            return (_a2 = b.textContent) == null ? void 0 : _a2.includes("Favorite");
          });
          await createAndInsertPostPageButtons(actionsDiv, favButton);
          fetchAndCachePostData();
        }
      } else if (path.includes("/user/")) {
        const userHeaderActions = document.querySelector(".user-header__actions");
        if (userHeaderActions) {
          userHeaderActions.prepend(createAuthorManagerButton());
        }
        createBulkDownloadPanel();
        const pageAuthorName = ((_b = (_a = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "UnknownAuthor";
        document.querySelectorAll("article.post-card[data-id]").forEach((cardNode) => {
          const card = cardNode;
          injectPostCardButtons(card, pageAuthorName);
          if (!card.querySelector(".kdl-post-checkbox")) {
            const checkbox = el("input", {
              type: "checkbox",
              className: "kdl-post-checkbox",
              dataset: { id: card.dataset.id },
              onClick: (e) => e.stopPropagation()
            });
            card.appendChild(checkbox);
          }
          card.addEventListener("click", (event) => {
            var _a2;
            if (event.ctrlKey) {
              event.preventDefault();
              event.stopPropagation();
              (_a2 = card.querySelector(".kdl-post-checkbox")) == null ? void 0 : _a2.click();
            }
          });
        });
      } else if (path.startsWith("/artists") || path.startsWith("/creators")) {
        document.querySelectorAll("a.user-card[data-id][data-service]").forEach((c) => injectArtistFavoriteButton(c));
      } else if (path.startsWith("/posts") || path === "/") {
        document.querySelectorAll("article.post-card[data-id][data-user][data-service]").forEach((c) => injectPostFavoriteButton(c));
      }
    } catch (error) {
      console.error("Error during page content handling:", error);
    }
  }
  const runInitializationLogic = async (force = false) => {
    if (isInitializing) return;
    const currentUrl = window.location.href;
    const path = window.location.pathname;
    const isPostPage = path.includes("/post/");
    const isUserPage = path.includes("/user/");
    const isPostsListPage = path.startsWith("/posts") || path === "/";
    const isArtistsListPage = path.startsWith("/artists") || path.startsWith("/creators");
    if (!isPostPage && !isUserPage && !isPostsListPage && !isArtistsListPage) {
      lastUrl = currentUrl;
      return;
    }
    const buttonsExist = isPostPage ? document.querySelector(".kdl-button") : document.querySelector("#kdl-bulk-panel");
    if (!force && buttonsExist && currentUrl === lastUrl) {
      if (isUserPage) initializeShiftClickLogic();
      return;
    }
    isInitializing = true;
    debugLog(`Running initialization for PWA/SPA page: ${currentUrl}`);
    try {
      if (isPostPage) await waitForElement(".post__actions");
      else if (isUserPage) await waitForElement(".card-list");
      await handlePageContent();
      lastUrl = currentUrl;
      if (isUserPage) initializeShiftClickLogic();
    } catch (error) {
      debugLog("Initialization error or timeout:", error);
    } finally {
      isInitializing = false;
    }
  };
  function init() {
    createFixedControls();
    runInitializationLogic();
    document.addEventListener("htmx:afterSettle", () => runInitializationLogic(true));
    document.addEventListener("htmx:afterSwap", () => runInitializationLogic(true));
    document.addEventListener("htmx:historyRestore", () => runInitializationLogic(true));
    window.addEventListener("popstate", () => runInitializationLogic(true));
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => runInitializationLogic(true), 50);
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => runInitializationLogic(true), 50);
    };
    let observerTimeout = null;
    const observer = new MutationObserver(() => {
      if (observerTimeout) clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        if (window.location.href !== lastUrl || !document.querySelector(".kdl-button, #kdl-bulk-panel")) {
          runInitializationLogic();
        }
      }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
