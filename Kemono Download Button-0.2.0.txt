// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.2.0
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
  const DB_NAME = "KemonoDownloaderCache";
  const DB_VERSION = 1;
  const STORE_FILES = "files";
  const STORE_POSTS = "posts";
  let dbPromise = null;
  const inMemoryPostCache = /* @__PURE__ */ new Map();
  const inMemoryFileCache = /* @__PURE__ */ new Map();
  function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        return reject(new Error("IndexedDB is not supported in this browser."));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const fileStore = db.createObjectStore(STORE_FILES, { keyPath: "url" });
          fileStore.createIndex("completed", "completed", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_POSTS)) {
          db.createObjectStore(STORE_POSTS, { keyPath: "key" });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => {
        console.error("Failed to open IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
    return dbPromise;
  }
  async function getCachedFile(url) {
    if (inMemoryFileCache.has(url)) {
      const item = inMemoryFileCache.get(url);
      if (item.completed) return item.data;
    }
    try {
      const db = await getDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readonly");
        const store = tx.objectStore(STORE_FILES);
        const req = store.get(url);
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.completed && result.data) {
            inMemoryFileCache.set(url, { data: result.data, completed: true });
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      debugLog("Failed to get cached file from IndexedDB:", e);
      return null;
    }
  }
  async function setCachedFile(url, data, completed) {
    inMemoryFileCache.set(url, { data, completed });
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readwrite");
        const store = tx.objectStore(STORE_FILES);
        store.put({
          url,
          data,
          completed,
          size: data.byteLength,
          timestamp: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to set cached file in IndexedDB:", e);
    }
  }
  async function getCachedPost(key) {
    if (inMemoryPostCache.has(key)) {
      return inMemoryPostCache.get(key);
    }
    try {
      const db = await getDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_POSTS, "readonly");
        const store = tx.objectStore(STORE_POSTS);
        const req = store.get(key);
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.data) {
            inMemoryPostCache.set(key, result.data);
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      debugLog("Failed to get cached post from IndexedDB:", e);
      return null;
    }
  }
  async function setCachedPost(key, data) {
    inMemoryPostCache.set(key, data);
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_POSTS, "readwrite");
        const store = tx.objectStore(STORE_POSTS);
        store.put({ key, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to set cached post in IndexedDB:", e);
    }
  }
  async function clearIncompleteCache() {
    let deletedCount = 0;
    for (const [url, item] of inMemoryFileCache.entries()) {
      if (!item.completed) inMemoryFileCache.delete(url);
    }
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readwrite");
        const store = tx.objectStore(STORE_FILES);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (!cursor.value.completed) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to clear incomplete cache in IndexedDB:", e);
    }
    return deletedCount;
  }
  async function clearAllCache() {
    inMemoryPostCache.clear();
    inMemoryFileCache.clear();
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction([STORE_FILES, STORE_POSTS], "readwrite");
        tx.objectStore(STORE_FILES).clear();
        tx.objectStore(STORE_POSTS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to clear all cache in IndexedDB:", e);
    }
  }
  async function getCacheStats() {
    let count = 0;
    let totalSizeBytes = 0;
    try {
      const db = await getDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_FILES, "readonly");
        const store = tx.objectStore(STORE_FILES);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            count++;
            totalSizeBytes += cursor.value.size || (cursor.value.data ? cursor.value.data.byteLength : 0);
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    } catch (e) {
      debugLog("Failed to get cache stats from IndexedDB:", e);
    }
    return { count, totalSizeBytes };
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

        <h3>Manage Settings & Cache</h3>
        <div class="kdl-setting-item" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
            <button id="kdl-export-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px;">Export Settings</button>
            <button id="kdl-import-btn" style="padding: 8px 15px; background-color: #17a2b8; color: white; border: none; border-radius: 4px;">Import Settings</button>
            <input type="file" id="kdl-import-file-input" accept=".json" style="display: none;">
        </div>

        <div class="kdl-setting-item" style="display: flex; flex-direction: column; gap: 8px; align-items: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
            <div id="kdl-cache-stats-text" style="font-size: 13px; color: #ccc;">Cached Data: Loading...</div>
            <div style="display: flex; gap: 10px;">
                <button id="kdl-clear-incomplete-cache-btn" style="padding: 6px 12px; background-color: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Incomplete Cache</button>
                <button id="kdl-clear-all-cache-btn" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear All Cache</button>
            </div>
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
    document.getElementById("kdl-clear-incomplete-cache-btn").addEventListener("click", async () => {
      const deleted = await clearIncompleteCache();
      await refreshCacheStatsUI();
      showMessage(`Cleared ${deleted} incomplete cache entries!`, "info");
    });
    document.getElementById("kdl-clear-all-cache-btn").addEventListener("click", async () => {
      await clearAllCache();
      await refreshCacheStatsUI();
      showMessage("Entire cache has been cleared!", "info");
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
    refreshCacheStatsUI();
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
  async function refreshCacheStatsUI() {
    const statsElem = document.getElementById("kdl-cache-stats-text");
    if (!statsElem) return;
    const { count, totalSizeBytes } = await getCacheStats();
    const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
    statsElem.textContent = `Cached Data: ${count} files (${sizeMb} MB)`;
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
        const cacheKey = `post_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        const cached = await getCachedPost(cacheKey);
        if (cached) {
          rawApiData = cached;
          debugLog(`Post metadata loaded from cache: ${cacheKey}`);
        } else {
          rawApiData = await fetchPostDataFromAPI(postDetails.service, postDetails.userID, postDetails.postID);
          if (rawApiData) await setCachedPost(cacheKey, rawApiData);
        }
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
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }
  var jszip_min = { exports: {} };
  /*!
  
    JSZip v3.10.1 - A JavaScript class for generating and reading zip files
    <http://stuartk.com/jszip>
  
    (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
    Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
    JSZip uses the library pako released under the MIT license :
    https://github.com/nodeca/pako/blob/main/LICENSE
    */
  (function(module, exports) {
    !function(e) {
      module.exports = e();
    }(function() {
      return function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof commonjsRequire && commonjsRequire;
              if (!e2 && t) return t(r, true);
              if (l) return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof commonjsRequire && commonjsRequire, e = 0; e < h.length; e++) u(h[e]);
        return u;
      }({ 1: [function(e, t, r) {
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function() {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        var n = e("./utils");
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _ = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S = 0;
          t2 && (S |= 8), l || !_ && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          }(h.unixPermissions, w)) : (C = 20, z |= function(e3) {
            return 63 & (e3 || 0);
          }(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: function(e3) {
            return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
          }(e2), meta: { percent: 100 } });
          else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          }(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2)) return false;
          for (var r2 = 0; r2 < t2.length; r2++) try {
            t2[r2].error(e2);
          } catch (e3) {
          }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3) throw new Error(r3 + " is not a valid compression method !");
                return n3;
              }(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        function n() {
          if (!(this instanceof n)) return new n();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
          if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc) return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2) return this;
          if (h(r2)) return this.filter(function(e3, t3) {
            return t3.dir && r2.test(e3);
          });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
          else for (var t2 = this.filter(function(e3, t3) {
            return t3.name.slice(0, r2.length) === r2;
          }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function() {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished) return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream) try {
          o = e("../nodejs/NodejsStreamOutputAdapter");
        } catch (e2) {
        }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                }(s2, function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                }(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          }(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
            else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
            else {
              for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
              1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
            }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          }(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          }(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2) return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        }(), nodebuffer: function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        }() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
            return i.stringifyByChunk(e2, r2, t2);
          } catch (e3) {
            t2 = Math.floor(t2 / 2);
          }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2) return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            }(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = function(e3) {
            for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
            return null;
          }(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var e2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2) this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2) this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2) throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
            var e3 = t2.document.createElement("script");
            e3.onreadystatechange = function() {
              u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
            }, t2.document.documentElement.appendChild(e3);
          } : function() {
            setTimeout(u, 0);
          };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2) throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
            t2.apply(e2, arguments);
          };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2) return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status) return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2) d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this) return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2) return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; ) h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2) return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
            n2 || (n2 = true, l.resolve(s2, e3));
          }, function(e3) {
            n2 || (n2 = true, l.reject(s2, e3));
          });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p)) return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l) throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _ = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a)) return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK) throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
          else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
          else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
          else {
            for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
            1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
          }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _ = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in) break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
              for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
              e2.strstart++;
            } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
            } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          }(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2) return _;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _ : (e2.state.gzhead = t2, m) : _;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _) : _;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
          else {
            var a2 = v + (n2.w_bits - 8 << 4) << 8;
            a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
          }
          if (69 === n2.status) if (n2.gzhead.extra) {
            for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
          } else n2.status = 73;
          if (73 === n2.status) if (n2.gzhead.name) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
          } else n2.status = 91;
          if (91 === n2.status) if (n2.gzhead.comment) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
          } else n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l) return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : 3 === n2.strategy ? function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S) {
                  if (j(e3), e3.lookahead <= S && t3 === l) return A;
                  if (0 === e3.lookahead) break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state) return _;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _, g, b, v, y, w, k, x, S, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e: do {
            p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
            t: for (; ; ) {
              if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
              else {
                if (!(16 & y)) {
                  if (0 == (64 & y)) {
                    v = m[(65535 & v) + (d & (1 << y) - 1)];
                    continue t;
                  }
                  if (32 & y) {
                    r2.mode = 12;
                    break e;
                  }
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break e;
                }
                w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _[d & b];
                r: for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                    if (0 == (64 & y)) {
                      v = _[(65535 & v) + (d & (1 << y) - 1)];
                      continue r;
                    }
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break e;
                  }
                  if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break e;
                  }
                  if (d >>>= y, p -= y, (y = s - a) < k) {
                    if (l < (y = k - y) && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (S = c, (x = 0) === f) {
                      if (x += u - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                    } else if (f < y) {
                      if (x += u + f - y, (y -= f) < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        if (x = 0, f < w) {
                          for (w -= y = f; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      }
                    } else if (x += f - y, y < w) {
                      for (w -= y; C[s++] = c[x++], --y; ) ;
                      x = s - k, S = C;
                    }
                    for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                    w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                  } else {
                    for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                    w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
            for (; t2 < 256; ) e2.lens[t2++] = 9;
            for (; t2 < 280; ) e2.lens[t2++] = 7;
            for (; t2 < 288; ) e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e: for (; ; ) switch (r2.mode) {
            case P:
              if (0 === r2.wrap) {
                r2.mode = 13;
                break;
              }
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (2 & r2.wrap && 35615 === u2) {
                E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                break;
              }
              if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                e2.msg = "incorrect header check", r2.mode = 30;
                break;
              }
              if (8 != (15 & u2)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
              else if (k > r2.wbits) {
                e2.msg = "invalid window size", r2.mode = 30;
                break;
              }
              r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
              break;
            case 2:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.flags = u2, 8 != (255 & r2.flags)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (57344 & r2.flags) {
                e2.msg = "unknown header flags set", r2.mode = 30;
                break;
              }
              r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
            case 3:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
            case 4:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
            case 5:
              if (1024 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
              } else r2.head && (r2.head.extra = null);
              r2.mode = 6;
            case 6:
              if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
              r2.length = 0, r2.mode = 7;
            case 7:
              if (2048 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.name = null);
              r2.length = 0, r2.mode = 8;
            case 8:
              if (4096 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.comment = null);
              r2.mode = 9;
            case 9:
              if (512 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (65535 & r2.check)) {
                  e2.msg = "header crc mismatch", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
              break;
            case 10:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
            case 11:
              if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
              e2.adler = r2.check = 1, r2.mode = 12;
            case 12:
              if (5 === t2 || 6 === t2) break e;
            case 13:
              if (r2.last) {
                u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                break;
              }
              for (; l2 < 3; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                case 0:
                  r2.mode = 14;
                  break;
                case 1:
                  if (j(r2), r2.mode = 20, 6 !== t2) break;
                  u2 >>>= 2, l2 -= 2;
                  break e;
                case 2:
                  r2.mode = 17;
                  break;
                case 3:
                  e2.msg = "invalid block type", r2.mode = 30;
              }
              u2 >>>= 2, l2 -= 2;
              break;
            case 14:
              for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                e2.msg = "invalid stored block lengths", r2.mode = 30;
                break;
              }
              if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
            case 15:
              r2.mode = 16;
            case 16:
              if (d = r2.length) {
                if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                break;
              }
              r2.mode = 12;
              break;
            case 17:
              for (; l2 < 14; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                e2.msg = "too many length or distance symbols", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 18;
            case 18:
              for (; r2.have < r2.ncode; ) {
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
              }
              for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
              if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid code lengths set", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 19;
            case 19:
              for (; r2.have < r2.nlen + r2.ndist; ) {
                for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (b < 16) u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                else {
                  if (16 === b) {
                    for (z = _ + 2; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 >>>= _, l2 -= _, 0 === r2.have) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                  } else if (17 === b) {
                    for (z = _ + 3; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                  } else {
                    for (z = _ + 7; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                  }
                  if (r2.have + d > r2.nlen + r2.ndist) {
                    e2.msg = "invalid bit length repeat", r2.mode = 30;
                    break;
                  }
                  for (; d--; ) r2.lens[r2.have++] = k;
                }
              }
              if (30 === r2.mode) break;
              if (0 === r2.lens[256]) {
                e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                break;
              }
              if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid literal/lengths set", r2.mode = 30;
                break;
              }
              if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                e2.msg = "invalid distances set", r2.mode = 30;
                break;
              }
              if (r2.mode = 20, 6 === t2) break e;
            case 20:
              r2.mode = 21;
            case 21:
              if (6 <= o2 && 258 <= h2) {
                e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                break;
              }
              for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (g && 0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, 0 === g) {
                r2.mode = 26;
                break;
              }
              if (32 & g) {
                r2.back = -1, r2.mode = 12;
                break;
              }
              if (64 & g) {
                e2.msg = "invalid literal/length code", r2.mode = 30;
                break;
              }
              r2.extra = 15 & g, r2.mode = 22;
            case 22:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              r2.was = r2.length, r2.mode = 23;
            case 23:
              for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                e2.msg = "invalid distance code", r2.mode = 30;
                break;
              }
              r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
            case 24:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              if (r2.offset > r2.dmax) {
                e2.msg = "invalid distance too far back", r2.mode = 30;
                break;
              }
              r2.mode = 25;
            case 25:
              if (0 === h2) break e;
              if (d = c2 - h2, r2.offset > d) {
                if ((d = r2.offset - d) > r2.whave && r2.sane) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
              } else m = i2, p = a2 - r2.offset, d = r2.length;
              for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
              0 === r2.length && (r2.mode = 21);
              break;
            case 26:
              if (0 === h2) break e;
              i2[a2++] = r2.length, h2--, r2.mode = 21;
              break;
            case 27:
              if (r2.wrap) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 |= n2[s2++] << l2, l2 += 8;
                }
                if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                  e2.msg = "incorrect data check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 28;
            case 28:
              if (r2.wrap && r2.flags) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (4294967295 & r2.total)) {
                  e2.msg = "incorrect length check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 29;
            case 29:
              x = 1;
              break e;
            case 30:
              x = -3;
              break e;
            case 31:
              return -4;
            case 32:
            default:
              return U;
          }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state) return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++) O[b] = 0;
          for (v = 0; v < n; v++) O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
          if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++) ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
          if (0 < z && (0 === e2 || 1 !== w)) return -1;
          for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
          for (; ; ) {
            for (p = b - S, _ = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _ | 0, 0 !== u; ) ;
            for (h = 1 << b - 1; E & h; ) h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w) break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _ = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
          e2.heap[--e2.heap_max] = e2.heap[1], function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          }(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
            if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
            else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
            s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
          }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            M(e3), U(e3, r3), U(e3, ~r3), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          }(e2, t2, r2);
        }
        r._tr_init = function(e2) {
          q || (function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
            for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          }(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
            for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
            return o;
          }(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          }(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          }(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          }(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !function(r2, n) {
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              }() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u) setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    }(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          }("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(jszip_min);
  var jszip_minExports = jszip_min.exports;
  const JSZip = /* @__PURE__ */ getDefaultExportFromCjs(jszip_minExports);
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
    task.updateStatus("Fetching post metadata...");
    console.log(`[Kemono DL] Initiating ZIP task for post ${postDetails.postID}: "${postDetails.postTitle}"`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      if (files.length === 0) throw new Error("No content to ZIP.");
      let successCount = 0;
      let failCount = 0;
      const urlFiles = files.filter((t) => t.source === "url");
      const totalUrlFiles = urlFiles.length;
      console.log(`[Kemono DL] Total files collected: ${files.length} (${totalUrlFiles} URLs, ${files.length - totalUrlFiles} text items)`);
      task.updateStatus(`Downloading ${totalUrlFiles} files...`);
      const ZipConstructor = typeof JSZip !== "undefined" ? JSZip : window.JSZip;
      if (!ZipConstructor) {
        throw new Error("JSZip library is not loaded. Please verify JSZip availability.");
      }
      const zip = new ZipConstructor();
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
            console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Starting download: ${file.name} (${file.data})`);
            const cachedData = await getCachedFile(file.data);
            let arrayBuffer;
            if (cachedData) {
              console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Loaded from cache: ${file.name}`);
              arrayBuffer = cachedData;
              task.updateFileProgress(fileTaskId, 100);
            } else {
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
              arrayBuffer = response.response;
              if (arrayBuffer && arrayBuffer.byteLength > 0) {
                console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Downloaded successfully (${arrayBuffer.byteLength} bytes). Saving to cache.`);
                await setCachedFile(file.data, arrayBuffer, true);
              }
            }
            zip.file(file.name, arrayBuffer);
            task.markFileComplete(fileTaskId, true);
          } catch (error) {
            failCount++;
            console.error(`[Kemono DL Error] File ${i + 1} download failed for URL "${file.data}":`, error);
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
      console.log(`[Kemono DL] All downloads finished. Succeeded: ${successCount - failCount}, Failed: ${failCount}. Total files in zip object:`, Object.keys(zip.files).length);
      if (totalUrlFiles > 0 && failCount === totalUrlFiles) {
        throw new Error("All file downloads failed");
      }
      task.updateStatus("Zipping...");
      const zipName = sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`);
      console.log(`[Kemono DL] Starting zip.generateAsync for "${zipName}"...`);
      let lastLoggedPercent = -1;
      const zipPromise = zip.generateAsync({ type: "blob", compression: "STORE" }, (meta) => {
        const currentPercent = Math.floor(meta.percent);
        if (currentPercent !== lastLoggedPercent && currentPercent % 10 === 0) {
          lastLoggedPercent = currentPercent;
          console.log(`[Kemono DL] Zipping progress: ${currentPercent}%`);
        }
        task.updateStatus(`Zipping ${currentPercent}%`);
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("ZIP generation timed out after 60 seconds")), 6e4);
      });
      const blob = await Promise.race([zipPromise, timeoutPromise]);
      console.log(`[Kemono DL] ZIP generated! Size: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
      if (!blob || blob.size === 0) throw new Error("Generated ZIP is empty.");
      const blobUrl = URL.createObjectURL(blob);
      console.log(`[Kemono DL] Triggering download for blob URL ${blobUrl}...`);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = zipName;
      downloadAnchor.style.display = "none";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3e4);
      console.log(`[Kemono DL] Download triggered successfully for ${zipName}`);
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
