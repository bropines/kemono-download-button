// ==UserScript==
// @name         Kemono & Pawchive Download Button
// @namespace    http://tampermonkey.net/
// @version      0.8.7
// @author       hoami_523 + Gemini + bropines
// @description  Modular TypeScript refactor for Kemono, Coomer, and Pawchive
// @icon         https://kemono.cr/static/favicon.ico
// @updateURL    https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
// @downloadURL  https://raw.githubusercontent.com/bropines/kemono-download-button/main/kemono-download-button.user.js
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

var KemonoDownloadButton = function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

/* Native UI Post Actions (.post__flag & .post__fav) */
.post__actions {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  align-items: center !important;
  margin-top: 8px !important;
  padding: 0 !important;
}

.post__actions > * {
  margin: 0 !important;
}

.post__flag,
.post__fav {
  padding: 6px 14px !important;
  border-radius: 5px !important;
  font-size: 0.88em !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  outline: none !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.post__flag,
.post__flag span,
.post__flag-icon {
  color: #f1f5f9 !important;
}

.post__flag {
  background-color: #2e3440 !important;
  border: 1px solid #4c566a !important;
}

.post__flag .post__flag-icon {
  color: #ef4444 !important;
}

.post__flag:hover {
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.35) !important;
  outline: none !important;
  text-shadow: none !important;
}

.post__flag:hover,
.post__flag:hover span,
.post__flag:hover .post__flag-icon {
  color: #ffffff !important;
}

.post__fav,
.post__fav span,
.post__fav-icon {
  color: #f1f5f9 !important;
}

.post__fav {
  background-color: #2e3440 !important;
  border: 1px solid #4c566a !important;
}

.post__fav .post__fav-icon {
  color: #fbbf24 !important;
}

.post__fav:hover {
  background-color: #ffc107 !important;
  border-color: #ffc107 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 10px rgba(255, 193, 7, 0.35) !important;
  outline: none !important;
  text-shadow: none !important;
}

.post__fav:hover,
.post__fav:hover span,
.post__fav:hover .post__fav-icon {
  color: #111827 !important;
}

.user-header__manage,
#kdl-author-manager-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.4rem !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  padding: 0 !important;
  margin: 0 !important;
  font-family: Helvetica, sans-serif !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  color: #f1f5f9 !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8) !important;
  cursor: pointer !important;
  transition: color 0.2s ease, transform 0.1s ease !important;
  text-decoration: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  height: auto !important;
}

.user-header__manage:hover,
#kdl-author-manager-btn:hover {
  color: #c084fc !important;
  text-shadow: 0 0 10px rgba(192, 132, 252, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9) !important;
  transform: translateY(-1px) !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.user-header__manage span,
#kdl-author-manager-btn span {
  font-family: Helvetica, sans-serif !important;
  font-size: inherit !important;
  font-weight: 700 !important;
  color: inherit !important;
  text-shadow: inherit !important;
}

/* UserScript 2-Column Action Panel */
@media (min-width: 850px) {
  .post__header {
    position: relative !important;
  }
  .post__info {
    padding-right: 400px !important;
  }
  .kdl-actions-container {
    position: absolute !important;
    top: 15px !important;
    right: 15px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 10px !important;
    width: 380px !important;
  }
}

@media (max-width: 849px) {
  .kdl-actions-container {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    margin-top: 12px !important;
    width: 100% !important;
  }
}

.kdl-actions-col {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.kdl-button {
  padding: 7px 12px !important;
  border: none !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-size: 0.86rem !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  color: #fff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  outline: none !important;
  text-shadow: none !important;
  transition: opacity 0.2s ease, transform 0.15s ease, filter 0.2s ease !important;
}

.kdl-button:hover {
  opacity: 0.95 !important;
  filter: brightness(1.1) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
}

.kdl-button:active {
  transform: translateY(0) !important;
}

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
  background-color: rgba(10, 13, 18, 0.75);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
#kdl-settings-modal {
  background: linear-gradient(145deg, #1c2029 0%, #151820 100%);
  color: #f8fafc;
  border-radius: 14px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 1180px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  overflow: hidden;
}
#kdl-settings-modal-content {
  overflow-y: auto;
  padding: 20px 24px;
}
#kdl-settings-modal-content::-webkit-scrollbar {
  width: 8px;
}
#kdl-settings-modal-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
#kdl-settings-modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px;
}
#kdl-settings-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

#kdl-settings-modal h2 {
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 10px;
  color: #38bdf8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* 3-Column Grid Layout */
.kdl-settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .kdl-settings-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .kdl-settings-grid {
    grid-template-columns: 1fr;
  }
}

.kdl-settings-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.kdl-settings-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 14px 16px;
}

.kdl-settings-card h3 {
  margin-top: 0 !important;
  margin-bottom: 12px !important;
  color: #f1f5f9 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding-bottom: 6px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
}

.kdl-settings-card h4 {
  margin-top: 14px !important;
  margin-bottom: 8px !important;
  color: #cbd5e1 !important;
  font-size: 0.9rem !important;
  font-weight: 600 !important;
}

.kdl-setting-item {
  margin-bottom: 12px;
}

#kdl-settings-modal label {
  display: block;
  margin-top: 6px;
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 0.86rem;
  color: #e2e8f0;
}

#kdl-settings-modal input[type=checkbox] {
  margin-right: 8px;
  vertical-align: middle;
  width: 16px;
  height: 16px;
  accent-color: #38bdf8;
  cursor: pointer;
}

#kdl-settings-modal input[type=number],
#kdl-settings-modal input[type=text],
#kdl-settings-modal input[type=password],
#kdl-settings-modal select {
  width: 100%;
  padding: 8px 11px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background-color: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  box-sizing: border-box;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

#kdl-settings-modal input[type=number]:focus,
#kdl-settings-modal input[type=text]:focus,
#kdl-settings-modal input[type=password]:focus,
#kdl-settings-modal select:focus {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
  outline: none;
}

#kdl-settings-modal input[type=number] {
  width: 90px;
}

#kdl-settings-modal select option {
  background-color: #1e222b;
  color: #f8fafc;
}

.kdl-cache-box {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  font-size: 0.82rem;
  color: #94a3b8;
}

.kdl-setting-checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
  margin-top: 6px;
}

/* Modal Button Classes */
.kdl-btn-primary, .kdl-btn-info, .kdl-btn-warn, .kdl-btn-danger, .kdl-btn-success {
  border: none !important;
  border-radius: 6px !important;
  padding: 7px 12px !important;
  font-weight: 600 !important;
  font-size: 0.82rem !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  color: #fff !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.kdl-btn-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important; }
.kdl-btn-info { background: linear-gradient(135deg, #06b6d4, #0891b2) !important; }
.kdl-btn-warn { background: linear-gradient(135deg, #f59e0b, #d97706) !important; }
.kdl-btn-danger { background: linear-gradient(135deg, #ef4444, #b91c1c) !important; }
.kdl-btn-success { background: linear-gradient(135deg, #10b981, #047857) !important; }

.kdl-btn-primary:hover, .kdl-btn-info:hover, .kdl-btn-warn:hover, .kdl-btn-danger:hover, .kdl-btn-success:hover {
  transform: translateY(-1px) !important;
  filter: brightness(1.12) !important;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
}

/* Tooltips */
.kdl-tooltip-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.75rem;
  color: #38bdf8;
  cursor: help;
  margin-left: 4px;
  vertical-align: middle;
}

.kdl-tooltip-trigger:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #0f172a;
  color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 7px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  font-size: 0.78rem;
  font-weight: 400;
  white-space: normal;
  width: 230px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  z-index: 10010;
  pointer-events: none;
  line-height: 1.4;
  text-align: left;
}

.kdl-tooltip-trigger:hover::before {
  content: '';
  position: absolute;
  bottom: 115%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #0f172a transparent transparent transparent;
  z-index: 10011;
  pointer-events: none;
}

.kdl-settings-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background-color: rgba(20, 24, 32, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
  position: sticky;
  bottom: 0;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.kdl-settings-config-btns {
  display: flex;
  gap: 8px;
}

.kdl-settings-modal-btns {
  display: flex;
  gap: 10px;
}

#kdl-settings-modal button.kdl-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  padding: 9px 22px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
}

#kdl-settings-modal button.kdl-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.35);
  filter: brightness(1.1);
}

#kdl-settings-modal button.kdl-close {
  background-color: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}

#kdl-settings-modal button.kdl-close:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-1px);
}

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
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(140%);
  opacity: 0;
  pointer-events: none;
  background-color: #1e1e1ef2;
  padding: 10px 20px;
  border-radius: 30px;
  z-index: 9999;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  border: 1px solid #444;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
#kdl-bulk-panel.kdl-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
#kdl-bulk-panel button { padding: 8px 14px; border: none; border-radius: 20px; cursor: pointer; font-size: .9em; font-weight: 500; color: #fff; transition: background-color .2s, transform .1s; }
#kdl-bulk-panel button:active { transform: scale(0.96); }
#kdl-bulk-download-btn { background-color: #28a745; }
#kdl-bulk-download-btn:hover { background-color: #218838; }
#kdl-bulk-download-btn:disabled { background-color: #555; cursor: not-allowed; opacity: 0.7; }
#kdl-bulk-select-all { background-color: #007bff; }
#kdl-bulk-select-all:hover { background-color: #0069d9; }
#kdl-bulk-deselect-all { background-color: #dc3545; }
#kdl-bulk-deselect-all:hover { background-color: #c82333; }

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
  background-color: rgba(10, 13, 18, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10003;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
#kdl-file-picker-modal {
  background: linear-gradient(145deg, #1c2029 0%, #151820 100%);
  color: #f8fafc;
  border-radius: 14px;
  padding: 24px;
  width: 620px;
  max-width: 92vw;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
#kdl-file-picker-modal h4 {
  margin: 0 0 16px;
  color: #38bdf8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
}
#kdl-file-picker-list {
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
#kdl-file-picker-list li {
  margin: 0;
}
#kdl-file-picker-list a {
  display: block;
  padding: 10px 14px;
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.88rem;
}
#kdl-file-picker-list a:hover {
  background-color: rgba(56, 189, 248, 0.12);
  border-color: #38bdf8;
  color: #ffffff;
  transform: translateX(3px);
}

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
  background-color: rgba(10, 13, 18, 0.75);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 10003;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
#kdl-author-manager-modal {
  background: linear-gradient(145deg, #1c2029 0%, #151820 100%);
  color: #f8fafc;
  border-radius: 14px;
  width: 840px;
  max-width: 95vw;
  height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
#kdl-manager-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(255, 255, 255, 0.02);
}
#kdl-manager-header h3 {
  margin: 0;
  color: #38bdf8;
  font-size: 1.25rem;
  font-weight: 700;
}
#kdl-manager-controls {
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  align-items: center;
  background-color: rgba(0, 0, 0, 0.15);
}
#kdl-manager-search {
  flex-grow: 1;
  padding: 9px 14px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}
#kdl-manager-search:focus {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #38bdf8;
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}
.kdl-manager-btn {
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}
#kdl-manager-post-list {
  overflow-y: auto;
  flex-grow: 1;
  padding: 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
#kdl-manager-post-list .post-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
#kdl-manager-post-list .post-item:hover {
  background-color: rgba(255, 255, 255, 0.07);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-1px);
}
#kdl-manager-post-list .post-item input[type=checkbox] {
  margin-right: 15px;
  width: 18px;
  height: 18px;
  accent-color: #38bdf8;
  cursor: pointer;
}
.post-item-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.post-item-title {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.92rem;
}
.post-item-date {
  font-size: 0.8rem;
  color: #94a3b8;
}
#kdl-manager-footer {
  padding: 14px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(20, 24, 32, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.post-item-preview {
  width: 60px;
  height: 60px;
  object-fit: cover;
  margin-right: 15px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.post-item-open-link {
  margin-left: auto;
  padding: 6px 12px;
  font-size: 1rem;
  line-height: 1;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #94a3b8;
}
.post-item-open-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #38bdf8;
}

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

.kdl-chips-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.kdl-chips-container:focus-within {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.kdl-chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kdl-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.22));
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 600;
}

.kdl-chip-remove {
  cursor: pointer;
  font-size: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s, color 0.2s;
}

.kdl-chip-remove:hover {
  opacity: 1;
  color: #ef4444;
}

.kdl-chips-input {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 4px 0 !important;
  font-size: 0.85rem !important;
  color: #f8fafc !important;
  outline: none !important;
  width: 100% !important;
}
`;
  const DEFAULT_PRESET_TEMPLATES = [
    { name: "Default (Date + Author + Title)", template: "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}" },
    { name: "Author Folder (Author/Date_Title/File)", template: "{author_name}/{post_date}_{post_title}/{file_name}" },
    { name: "Flat with Index (Author - Title/Index_File)", template: "{author_name} - {post_title}/{file_index}_{file_name}" },
    { name: "Service & Author ([Service] Author/Date_Title/Index_File)", template: "[{service}] {author_name}/{post_date}_{post_title}/{file_index}_{file_name}" },
    { name: "Global Index (Author/GlobalIndex_File)", template: "{author_name}/{global_file_index}_{file_name}" }
  ];
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
    zipCompressionLevel: 0,
    addMetadataFile: true,
    addHtmlIndexInZip: true,
    fileNameTemplate: "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}",
    bulkDownloadMode: "single",
    bulkSingleSystemPathTemplate: "{author_name}/[Kemono] {author_name} - {post_count} posts.zip",
    bulkSingleInternalPathTemplate: "{post_date}_{post_title}/{file_index}_{file_name}",
    cacheDurationHours: 24,
    bulkMultipleSystemPathTemplate: "{author_name}/{post_date}_{post_title}.zip",
    savedFileNameTemplates: DEFAULT_PRESET_TEMPLATES,
    ignoredFileExtensions: []
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
    if (!path) return "";
    let cleanPath = path.startsWith("/") ? path : "/" + path;
    if (!cleanPath.startsWith("/data/")) {
      cleanPath = "/data" + cleanPath;
    }
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    return `https://img.${baseDomain}/thumbnail${cleanPath}`;
  }
  function sanitizeFilename(filename) {
    return String(filename || "untitled").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim() || "untitled";
  }
  const MEDIA_EXTENSIONS = /* @__PURE__ */ new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "avif",
    "mp4",
    "webm",
    "mkv",
    "mov",
    "avi",
    "wmv",
    "m4v",
    "mp3",
    "wav",
    "flac",
    "ogg",
    "m4a",
    "aac"
  ]);
  function isMediaFile(filename) {
    var _a2;
    if (!filename) return false;
    const ext = ((_a2 = filename.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
    return MEDIA_EXTENSIONS.has(ext);
  }
  function isFileExtensionIgnored(filename, ignoredExts) {
    var _a2;
    if (!ignoredExts || ignoredExts.length === 0 || !filename) return false;
    const ext = ((_a2 = filename.split(".").pop()) == null ? void 0 : _a2.toLowerCase()) || "";
    return ignoredExts.some((ignored) => ignored.toLowerCase().replace(/^\./, "").trim() === ext);
  }
  function generateRandomId(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i2 = 0; i2 < length; i2++) {
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
    for (let i2 = 0; i2 < keys.length; i2++) {
      const key = keys[i2];
      loadedSettings[key] = values[i2];
    }
    state.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
    if (!state.settings.fileNameTemplate || !state.settings.fileNameTemplate.trim()) {
      state.settings.fileNameTemplate = DEFAULT_SETTINGS.fileNameTemplate;
    }
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
                const err2 = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
                err2.status = response.status;
                reject(err2);
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
          } else if (error.status === 404 || error.status === 401 || error.status === 403) {
            throw error;
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
  async function fetchPostDataFromAPI$1(service, userID, postID) {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
    debugLog(`[Kemono API] Fetching post data: ${url}`);
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
        if (progressTask) {
          progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
        }
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
          debugLog("Reached end of posts (API returned 400). Normal exit condition.");
        } else {
          console.error(`Failed to fetch posts at offset ${offset}:`, error);
          showMessage("Error fetching full post list.", "error");
          if (progressTask) {
            progressTask.updateStatus(`Error fetching posts: ${error.message}`);
          }
        }
        break;
      }
    }
    if (progressTask) {
      progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
      progressTask.finish(3e3);
    }
    return allPosts;
  }
  async function searchPosts(query = "", offset = 0, service = "") {
    try {
      let path = `/api/v1/posts?o=${offset}`;
      if (query) path += `&q=${encodeURIComponent(query)}`;
      if (service) path += `&service=${encodeURIComponent(service)}`;
      const url = getApiUrl(path);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("[Kemono API] Failed searchPosts", e);
      return [];
    }
  }
  async function fetchPopularPosts() {
    try {
      const url = getApiUrl("/api/v1/posts/popular");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("[Kemono API] Failed fetchPopularPosts", e);
      return [];
    }
  }
  async function fetchPostRevisions(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchPostRevisions", e);
      return null;
    }
  }
  async function fetchCommentsFromAPI(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCommentsFromAPI", e);
      return null;
    }
  }
  async function fetchTagsFromAPI(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/tags`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchTagsFromAPI", e);
      return null;
    }
  }
  async function flagPost(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
      await gmXmlhttpRequestWithRetries({ method: "POST", url });
      return true;
    } catch (e) {
      debugLog("[Kemono API] Failed flagPost", e);
      return false;
    }
  }
  async function fetchCreators() {
    try {
      const url = getApiUrl("/api/v1/creators.txt");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreators", e);
      return null;
    }
  }
  async function fetchUpdatedCreators() {
    try {
      const url = getApiUrl("/api/v1/creators/updated");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchUpdatedCreators", e);
      return null;
    }
  }
  async function fetchCreatorProfile(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorProfile", e);
      return null;
    }
  }
  async function fetchCreatorAnnouncements(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorAnnouncements", e);
      return null;
    }
  }
  async function fetchCreatorFancards(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorFancards", e);
      return null;
    }
  }
  async function fetchCreatorLinks(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorLinks", e);
      return null;
    }
  }
  async function fetchUserFavorites() {
    if (appState.favoritesFetched) return true;
    await getSettings();
    if (!state.settings.sessionCookie) return false;
    debugLog("[Kemono API] Fetching user favorites...");
    try {
      const [artistsRes, postsRes] = await Promise.all([
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=artist"), responseType: "json" }),
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=post"), responseType: "json" })
      ]);
      if (artistsRes.response && Array.isArray(artistsRes.response)) {
        artistsRes.response.forEach((artist) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
      }
      if (postsRes.response && Array.isArray(postsRes.response)) {
        postsRes.response.forEach((post) => appState.favoritedPosts.add(post.id));
      }
      appState.favoritesFetched = true;
      debugLog(`[Kemono API] Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
      return true;
    } catch (error) {
      if (error.message && error.message.includes("Status 401")) {
        showMessage("Favorites: Auth failed. Check your session cookie.", "error");
      }
      return false;
    }
  }
  async function fetchAccountProfile() {
    try {
      const url = getApiUrl("/api/v1/account/profile");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchAccountProfile", e);
      return null;
    }
  }
  async function toggleFavorite$1(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.textContent = "⏳";
    button.disabled = true;
    try {
      await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
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
      console.error("[Kemono API] Favorite toggle failed:", error);
      showMessage("Failed to update favorites.", "error");
    } finally {
      button.textContent = "⭐";
      button.disabled = false;
    }
  }
  async function fetchDMs() {
    try {
      const url = getApiUrl("/api/v1/dms");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDMs", e);
      return null;
    }
  }
  async function fetchCreatorDMs(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/dms`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchCreatorDMs", e);
      return null;
    }
  }
  async function fetchShares() {
    try {
      const url = getApiUrl("/api/v1/shares");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchShares", e);
      return null;
    }
  }
  async function lookupHash(fileHash) {
    try {
      const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed lookupHash", e);
      return null;
    }
  }
  async function fetchAppVersion() {
    try {
      const url = getApiUrl("/api/v1/app_version");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchAppVersion", e);
      return null;
    }
  }
  async function fetchDiscordChannels() {
    try {
      const url = getApiUrl("/api/v1/discord/channels");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDiscordChannels", e);
      return null;
    }
  }
  async function fetchDiscordChannelMessages(channelId) {
    try {
      const url = getApiUrl(`/api/v1/discord/channel/${encodeURIComponent(channelId)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("[Kemono API] Failed fetchDiscordChannelMessages", e);
      return null;
    }
  }
  const kemonoApiAdapter = {
    name: "kemono",
    fetchCreators,
    fetchUpdatedCreators,
    fetchCreatorProfile,
    fetchCreatorAnnouncements,
    fetchCreatorFancards,
    fetchCreatorLinks,
    fetchPostData: fetchPostDataFromAPI$1,
    fetchAllAuthorPosts,
    searchPosts,
    fetchPopularPosts,
    fetchPostRevisions,
    fetchComments: fetchCommentsFromAPI,
    fetchTags: fetchTagsFromAPI,
    flagPost,
    fetchUserFavorites,
    fetchAccountProfile,
    toggleFavorite: toggleFavorite$1,
    fetchDMs,
    fetchCreatorDMs,
    fetchShares,
    lookupHash,
    fetchAppVersion,
    fetchDiscordChannels,
    fetchDiscordChannelMessages
  };
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
  function tooltipSpan(text) {
    return el("span", { className: "kdl-tooltip-trigger", dataset: { tooltip: text } }, ["ℹ️"]);
  }
  function checkboxItem(id, text, tooltipText) {
    const checkbox = el("input", { type: "checkbox", id });
    const labelChildren = [checkbox, ` ${text}`];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    return el("div", { className: "kdl-setting-item" }, [el("label", {}, labelChildren)]);
  }
  function inputItem(id, type, labelText, props = {}, tooltipText, containerId) {
    const inputElem = el("input", { type, id, ...props });
    const labelChildren = [labelText];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    const labelElem = el("label", { htmlFor: id }, labelChildren);
    const containerProps = { className: "kdl-setting-item" };
    if (containerId) containerProps.id = containerId;
    return el("div", containerProps, [labelElem, inputElem]);
  }
  function selectItem(id, labelText, options, tooltipText) {
    const selectElem = el(
      "select",
      { id },
      options.map((opt) => el("option", { value: opt.value }, [opt.text]))
    );
    const labelChildren = [labelText];
    if (tooltipText) labelChildren.push(" ", tooltipSpan(tooltipText));
    const labelElem = el("label", { htmlFor: id }, labelChildren);
    return el("div", { className: "kdl-setting-item" }, [labelElem, selectElem]);
  }
  let renderIgnoredExtChipsFn = null;
  function createChipsInputItem(id, labelText, tooltipText) {
    const chipsWrapper = el("div", { className: "kdl-chips-wrapper" });
    const inputElem = el("input", {
      type: "text",
      id: `${id}-input`,
      placeholder: "Type ext (e.g. txt, psd) & press Enter...",
      className: "kdl-chips-input"
    });
    const renderChips = (values) => {
      const uniqueVals = [...new Set(values.map((v) => v.toLowerCase().replace(/^\./, "").trim()).filter(Boolean))];
      state.settings.ignoredFileExtensions = uniqueVals;
      chipsWrapper.replaceChildren(
        ...uniqueVals.map((val) => {
          const removeBtn = el(
            "span",
            {
              className: "kdl-chip-remove",
              onClick: (e) => {
                e.stopPropagation();
                const updated = (state.settings.ignoredFileExtensions || []).filter((v) => v !== val);
                renderChips(updated);
              }
            },
            ["✖"]
          );
          return el("span", { className: "kdl-chip" }, [val, removeBtn]);
        })
      );
    };
    renderIgnoredExtChipsFn = renderChips;
    const addExtension = (raw) => {
      const cleaned = raw.toLowerCase().replace(/^\./, "").trim();
      if (cleaned) {
        const current = state.settings.ignoredFileExtensions || [];
        if (!current.includes(cleaned)) {
          renderChips([...current, cleaned]);
        }
      }
      inputElem.value = "";
    };
    inputElem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addExtension(inputElem.value);
      }
    });
    inputElem.addEventListener("blur", () => {
      if (inputElem.value.trim()) {
        addExtension(inputElem.value);
      }
    });
    const labelChildren = [labelText];
    labelChildren.push(" ", tooltipSpan(tooltipText));
    return el("div", { className: "kdl-setting-item", id }, [
      el("label", { htmlFor: `${id}-input` }, labelChildren),
      el("div", { className: "kdl-chips-container" }, [chipsWrapper, inputElem])
    ]);
  }
  function cardContainer(title, children) {
    return el("div", { className: "kdl-settings-card" }, [
      el("h3", {}, [title]),
      ...children
    ]);
  }
  async function toggleSettingsModal(forceShow) {
    try {
      await getSettings();
    } catch (e) {
      console.error("[Kemono DL] Error loading settings:", e);
    }
    if (!settingsModalElement || !settingsOverlayElement || !document.body.contains(settingsOverlayElement)) {
      if (settingsOverlayElement && settingsOverlayElement.parentNode) {
        settingsOverlayElement.parentNode.removeChild(settingsOverlayElement);
      }
      settingsModalElement = null;
      settingsOverlayElement = null;
      createSettingsModal();
    }
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
      auto: "Auto",
      russian: "Russian",
      english: "English",
      chinese: "Chinese",
      japanese: "Japanese",
      korean: "Korean"
    };
    const langOptions = Object.entries(langCodeMap).map(([value, text]) => ({ value, text }));
    settingsOverlayElement = el("div", { id: "kdl-settings-overlay" });
    settingsModalElement = el("div", { id: "kdl-settings-modal" });
    const generalCard = cardContainer("⚙️ General & Cache", [
      checkboxItem("kdl-setting-enableAPIFetch", "Enable Site API Fetching", "Use fast site REST API instead of parsing HTML pages"),
      inputItem("kdl-setting-sessionCookie", "password", "Session Cookie", { placeholder: "Paste session cookie here" }, "Session authentication cookie. Required to access restricted or paywalled posts"),
      inputItem("kdl-setting-cacheDurationHours", "number", "Post List Cache Duration (Hours)", { min: 0, step: 1 }, "Post list cache retention duration. 0 = disable caching"),
      checkboxItem("kdl-setting-enableDebugLogging", "Enable Debug Logging in Console"),
      el("div", { className: "kdl-cache-box" }, [
        el("div", { id: "kdl-cache-stats-text" }, ["Cached Data: Loading..."]),
        el("div", { style: { display: "flex", gap: "8px", marginTop: "6px" } }, [
          el("button", { id: "kdl-clear-incomplete-cache-btn", className: "kdl-btn-warn", style: { flex: "1" } }, ["Clear Incomplete"]),
          el("button", { id: "kdl-clear-all-cache-btn", className: "kdl-btn-danger", style: { flex: "1" } }, ["Clear All"])
        ])
      ])
    ]);
    const templatesCard = cardContainer("📁 File Naming & Templates", [
      inputItem("kdl-setting-fileNameTemplate", "text", "Template for Individual Downloads", { placeholder: DEFAULT_SETTINGS.fileNameTemplate }, "Available tags: {author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}"),
      el("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" } }, [
        el("button", {
          type: "button",
          id: "kdl-template-reset-btn",
          className: "kdl-btn-info",
          style: { fontSize: "0.78rem", padding: "4px 10px" }
        }, ["🔄 Reset to Default Pattern"])
      ]),
      el("div", { className: "kdl-setting-item" }, [
        el("label", { htmlFor: "kdl-template-select" }, ["Saved Templates"]),
        el("div", { style: { display: "flex", gap: "6px" } }, [
          el("select", { id: "kdl-template-select", style: { flexGrow: "1" } }),
          el("button", { id: "kdl-template-delete-btn", className: "kdl-btn-danger" }, ["Delete"])
        ]),
        el("div", { style: { display: "flex", gap: "6px", marginTop: "6px" } }, [
          el("input", { type: "text", id: "kdl-template-name-input", placeholder: "New template name...", style: { flexGrow: "1" } }),
          el("button", { id: "kdl-template-save-btn", className: "kdl-btn-success" }, ["Save"])
        ])
      ]),
      el("h4", {}, ["Bulk Download Settings ", tooltipSpan("Choose between one big ZIP archive for all posts or individual ZIP archives per post")]),
      selectItem("kdl-setting-bulkDownloadMode", "Bulk Download Mode", [
        { value: "single", text: "One Big Archive" },
        { value: "multiple", text: "Multiple Archives (one per post)" }
      ]),
      el("div", { id: "kdl-bulk-single-settings" }, [
        inputItem("kdl-setting-bulkSingleSystemPathTemplate", "text", "System Path for Big Archive"),
        inputItem("kdl-setting-bulkSingleInternalPathTemplate", "text", "Internal Structure inside Big Archive")
      ]),
      el("div", { id: "kdl-bulk-multiple-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-bulkMultipleSystemPathTemplate", "text", "System Path for Multiple Archives")
      ])
    ]);
    const zipCard = cardContainer("📦 ZIP Engine & Performance", [
      selectItem(
        "kdl-setting-zipCompressionLevel",
        "ZIP Compression Level",
        [
          { value: "0", text: "0 - Store (Instant, 0% CPU - Recommended)" },
          { value: "1", text: "1 - Fast (Light Compression)" },
          { value: "4", text: "4 - Normal (Balanced)" },
          { value: "6", text: "6 - Standard (Medium Deflate)" },
          { value: "9", text: "9 - Maximum (Highest Compression)" }
        ],
        "0 = Store / Instant packaging (0% CPU, best for videos and images). 9 = Maximum compression"
      ),
      checkboxItem("kdl-setting-savePostContentAsText", "Save Post Content as .txt"),
      checkboxItem("kdl-setting-addMetadataFile", "Add metadata.json to ZIP"),
      checkboxItem("kdl-setting-addHtmlIndexInZip", "Add _index.html to Bulk ZIP"),
      checkboxItem("kdl-setting-savePostTags", "Add tags.txt to ZIP"),
      checkboxItem("kdl-setting-savePostComments", "Add comments.txt to ZIP"),
      inputItem("kdl-setting-maxConcurrentIndividualDownloads", "number", "Max Concurrent Downloads", { min: 1, max: 10 }, "Number of concurrent file download streams (1-10)"),
      inputItem("kdl-setting-zipFileDownloadTimeout", "number", "File Timeout (ms)", { min: 1e4, step: 1e3 }, "Maximum response timeout when downloading a file inside ZIP"),
      checkboxItem("kdl-setting-enableDownloadRetries", "Enable Download Retries", "Automatically retry failed downloads on network errors"),
      inputItem("kdl-setting-downloadRetryCount", "number", "Number of Retries", { min: 0, max: 5 }, void 0, "kdl-retry-count-setting"),
      inputItem("kdl-setting-downloadRetryDelay", "number", "Retry Delay (ms)", { min: 500, step: 500 }, void 0, "kdl-retry-delay-setting"),
      createChipsInputItem(
        "kdl-ignored-extensions-setting",
        "Ignored Extensions in ZIP",
        "File extensions to exclude from ZIP archives (e.g. txt, psd, mp4). Case-insensitive & auto-deduplicated."
      )
    ]);
    const translationCard = cardContainer("🌐 Translation", [
      selectItem(
        "kdl-setting-translationProvider",
        "Translation Provider",
        [
          { value: "none", text: "None" },
          { value: "gemini", text: "Gemini AI" },
          { value: "deepl", text: "DeepL" },
          { value: "yandex", text: "Yandex (Free)" },
          { value: "google", text: "Google (Free)" }
        ],
        "Service for automated translation of post titles and text content"
      ),
      selectItem("kdl-setting-translationLanguage", "Target Language", langOptions),
      el("div", { id: "kdl-gemini-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-geminiApiKey", "password", "Gemini API Key"),
        inputItem("kdl-setting-translationModelName", "text", "Model Name")
      ]),
      el("div", { id: "kdl-deepl-settings", style: { display: "none" } }, [
        inputItem("kdl-setting-deeplApiKey", "password", "DeepL API Key"),
        selectItem("kdl-setting-deeplApiTier", "API Tier", [
          { value: "free", text: "Free" },
          { value: "pro", text: "Pro" }
        ])
      ])
    ]);
    const visibleButtonsCard = cardContainer("👁️ Visible Buttons", [
      el("div", { className: "kdl-setting-checkbox-grid" }, [
        checkboxItem("kdl-setting-showZipButton", "ZIP Download"),
        checkboxItem("kdl-setting-showImagesButton", "Images"),
        checkboxItem("kdl-setting-showFilesButton", "Attachments"),
        checkboxItem("kdl-setting-showCopyLinksButton", "Copy Links"),
        checkboxItem("kdl-setting-showShareButton", "Share Links"),
        checkboxItem("kdl-setting-showTranslateButton", "Translate")
      ])
    ]);
    const col1 = el("div", { className: "kdl-settings-col" }, [generalCard, templatesCard]);
    const col2 = el("div", { className: "kdl-settings-col" }, [zipCard]);
    const col3 = el("div", { className: "kdl-settings-col" }, [translationCard, visibleButtonsCard]);
    const grid = el("div", { className: "kdl-settings-grid" }, [col1, col2, col3]);
    const modalContent = el("div", { id: "kdl-settings-modal-content" }, [
      el("h2", {}, ["⚙️ Downloader Settings"]),
      grid
    ]);
    const actionsFooter = el("div", { className: "kdl-settings-actions" }, [
      el("div", { className: "kdl-settings-config-btns" }, [
        el("button", { id: "kdl-export-btn", className: "kdl-btn-primary" }, ["Export Config"]),
        el("button", { id: "kdl-import-btn", className: "kdl-btn-info" }, ["Import Config"]),
        el("input", { type: "file", id: "kdl-import-file-input", accept: ".json", style: { display: "none" } })
      ]),
      el("div", { className: "kdl-settings-modal-btns" }, [
        el("button", { className: "kdl-close" }, ["Close"]),
        el("button", { className: "kdl-save" }, ["Save"])
      ])
    ]);
    settingsModalElement.appendChild(modalContent);
    settingsModalElement.appendChild(actionsFooter);
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
      await saveSetting("ignoredFileExtensions", state.settings.ignoredFileExtensions || []);
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
      var _a2;
      const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        var _a3;
        const count = await importSettings((_a3 = ev.target) == null ? void 0 : _a3.result);
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
    document.getElementById("kdl-template-save-btn").addEventListener("click", async () => {
      const name = templateNameInput.value.trim();
      const template = fileNameTemplateInput.value.trim();
      if (!name || !template) return showMessage("Please provide a name and a template pattern.", "warning");
      if (!state.settings.savedFileNameTemplates) state.settings.savedFileNameTemplates = [];
      const existingIndex = state.settings.savedFileNameTemplates.findIndex((t) => t.name === name);
      if (existingIndex > -1) state.settings.savedFileNameTemplates[existingIndex].template = template;
      else state.settings.savedFileNameTemplates.push({ name, template });
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates);
      templateNameInput.value = "";
      updateSettingsModalUI();
      showMessage(`Template "${name}" saved!`, "info");
    });
    document.getElementById("kdl-template-delete-btn").addEventListener("click", async () => {
      const selectedOption = templateSelect.options[templateSelect.selectedIndex];
      const nameToDelete = (selectedOption == null ? void 0 : selectedOption.dataset.name) || (selectedOption == null ? void 0 : selectedOption.textContent);
      if (!nameToDelete || !templateSelect.value) return showMessage("Select a custom template to delete.", "warning");
      state.settings.savedFileNameTemplates = (state.settings.savedFileNameTemplates || []).filter((t) => t.name !== nameToDelete);
      await saveSetting("savedFileNameTemplates", state.settings.savedFileNameTemplates);
      updateSettingsModalUI();
      showMessage(`Template "${nameToDelete}" deleted!`, "info");
    });
    document.getElementById("kdl-template-reset-btn").addEventListener("click", async () => {
      fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
      await saveSetting("fileNameTemplate", DEFAULT_SETTINGS.fileNameTemplate);
      showMessage("Reset template to default pattern!", "info");
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
    const fileNameTemplateInput = document.getElementById("kdl-setting-fileNameTemplate");
    if (fileNameTemplateInput && (!fileNameTemplateInput.value || !fileNameTemplateInput.value.trim())) {
      fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
    }
    refreshCacheStatsUI();
    const templateSelect = document.getElementById("kdl-template-select");
    templateSelect.replaceChildren(el("option", { value: "" }, ["-- Load a saved template --"]));
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
    const singleSettings = document.getElementById("kdl-bulk-single-settings");
    const multipleSettings = document.getElementById("kdl-bulk-multiple-settings");
    if (singleSettings) singleSettings.style.display = isSingleMode ? "block" : "none";
    if (multipleSettings) multipleSettings.style.display = isSingleMode ? "none" : "block";
    toggleTranslatorSettingsVisibility();
    toggleRetrySettingsVisibility();
    if (renderIgnoredExtChipsFn) {
      renderIgnoredExtChipsFn(state.settings.ignoredFileExtensions || []);
    }
  }
  function toggleTranslatorSettingsVisibility() {
    var _a2;
    const provider = (_a2 = document.getElementById("kdl-setting-translationProvider")) == null ? void 0 : _a2.value;
    const geminiElem = document.getElementById("kdl-gemini-settings");
    const deeplElem = document.getElementById("kdl-deepl-settings");
    if (geminiElem) geminiElem.style.display = provider === "gemini" ? "block" : "none";
    if (deeplElem) deeplElem.style.display = provider === "deepl" ? "block" : "none";
  }
  function toggleRetrySettingsVisibility() {
    var _a2;
    const enabled = (_a2 = document.getElementById("kdl-setting-enableDownloadRetries")) == null ? void 0 : _a2.checked;
    const countElem = document.getElementById("kdl-retry-count-setting");
    const delayElem = document.getElementById("kdl-retry-delay-setting");
    if (countElem) countElem.style.display = enabled ? "block" : "none";
    if (delayElem) delayElem.style.display = enabled ? "block" : "none";
  }
  async function refreshCacheStatsUI() {
    const statsElem = document.getElementById("kdl-cache-stats-text");
    if (!statsElem) return;
    const { count, totalSizeBytes } = await getCacheStats();
    const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
    statsElem.textContent = `Cached Data: ${count} files (${sizeMb} MB)`;
  }
  function createFixedControls() {
    const container = getOrCreateContainer("kdl-fixed-controls");
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }
    if (container.querySelector("#kdl-settings-btn")) return;
    appState.queueIndicatorElement = container.querySelector("#kdl-queue-indicator") || el("div", { id: "kdl-queue-indicator" });
    updateQueueIndicator();
    const settingsBtn = el(
      "button",
      {
        id: "kdl-settings-btn",
        title: "Kemono Downloader Settings",
        type: "button",
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSettingsModal();
        }
      },
      ["⚙️"]
    );
    if (!container.contains(appState.queueIndicatorElement)) {
      container.appendChild(appState.queueIndicatorElement);
    }
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
  async function fetchPostDataFromPawchive(service, userID, postID) {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
    debugLog(`Fetching post data from Pawchive API: ${url}`);
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url,
      responseType: "json",
      timeout: 3e4
    });
    return response.response;
  }
  async function fetchAllAuthorPostsPawchive(service, userID, progressTask) {
    let allPosts = [];
    let offset = 0;
    const limit = 50;
    while (true) {
      try {
        if (progressTask) {
          progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
        }
        const url = getApiUrl(`/api/v1/${service}/user/${userID}?o=${offset}`);
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
          debugLog("Reached end of posts (API returned 400). Normal exit condition.");
        } else {
          console.error(`Failed to fetch posts at offset ${offset}:`, error);
          showMessage("Error fetching full post list.", "error");
          if (progressTask) {
            progressTask.updateStatus(`Error fetching posts: ${error.message}`);
          }
        }
        break;
      }
    }
    if (progressTask) {
      progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
      progressTask.finish(3e3);
    }
    return allPosts;
  }
  async function fetchUserFavoritesPawchive() {
    if (appState.favoritesFetched) return true;
    await getSettings();
    if (!state.settings.sessionCookie) return false;
    debugLog("Fetching user favorites from Pawchive API...");
    try {
      const [artistsRes, postsRes] = await Promise.all([
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=artist"), responseType: "json" }),
        gmXmlhttpRequestWithRetries({ method: "GET", url: getApiUrl("/api/v1/account/favorites?type=post"), responseType: "json" })
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
      }
      return false;
    }
  }
  async function toggleFavoritePawchive(button, type, service, creatorId, postId = null, updateCardStateFn) {
    await getSettings();
    if (!state.settings.sessionCookie) {
      showMessage("Session cookie is required to manage favorites.", "error");
      return;
    }
    const artistKey = `${service}-${creatorId}`;
    const isFavorited = type === "creator" ? appState.favoritedArtists.has(artistKey) : postId ? appState.favoritedPosts.has(postId) : false;
    const method = isFavorited ? "DELETE" : "POST";
    const apiUrl = type === "creator" ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;
    button.textContent = "⏳";
    button.disabled = true;
    try {
      await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
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
      showMessage("Failed to update favorites.", "error");
    } finally {
      button.textContent = "⭐";
      button.disabled = false;
    }
  }
  async function fetchCommentsPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive comments", e);
      return null;
    }
  }
  async function fetchCreatorProfilePawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("Failed to fetch Pawchive profile", e);
      return null;
    }
  }
  async function fetchCreatorAnnouncementsPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive announcements", e);
      return null;
    }
  }
  async function fetchCreatorFancardsPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive fancards", e);
      return null;
    }
  }
  async function fetchCreatorLinksPawchive(service, userID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive links", e);
      return null;
    }
  }
  async function fetchCreatorsPawchive() {
    try {
      const url = getApiUrl("/api/v1/creators");
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response;
    } catch (e) {
      debugLog("Failed to fetch Pawchive creators", e);
      return null;
    }
  }
  async function searchPostsPawchive(query, offset = 0) {
    try {
      const url = getApiUrl(`/api/v1/posts?q=${encodeURIComponent(query)}&o=${offset}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : [];
    } catch (e) {
      debugLog("Failed to search Pawchive posts", e);
      return [];
    }
  }
  async function fetchPostRevisionsPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return Array.isArray(res.response) ? res.response : null;
    } catch (e) {
      debugLog("Failed to fetch Pawchive revisions", e);
      return null;
    }
  }
  async function lookupHashPawchive(fileHash) {
    try {
      const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
      const res = await gmXmlhttpRequestWithRetries({ method: "GET", url, responseType: "json" });
      return res.response || null;
    } catch (e) {
      debugLog("Failed Pawchive hash lookup", e);
      return null;
    }
  }
  async function flagPostPawchive(service, userID, postID) {
    try {
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
      await gmXmlhttpRequestWithRetries({ method: "POST", url });
      return true;
    } catch (e) {
      debugLog("Failed flag post Pawchive", e);
      return false;
    }
  }
  const pawchiveApiAdapter = {
    name: "pawchive",
    fetchPostData: fetchPostDataFromPawchive,
    fetchAllAuthorPosts: fetchAllAuthorPostsPawchive,
    fetchCreatorProfile: fetchCreatorProfilePawchive,
    fetchCreatorAnnouncements: fetchCreatorAnnouncementsPawchive,
    fetchCreatorFancards: fetchCreatorFancardsPawchive,
    fetchCreatorLinks: fetchCreatorLinksPawchive,
    fetchCreators: fetchCreatorsPawchive,
    searchPosts: searchPostsPawchive,
    fetchUserFavorites: fetchUserFavoritesPawchive,
    toggleFavorite: toggleFavoritePawchive,
    // Pawchive does NOT have a tags endpoint - returns null immediately
    fetchTags: async () => null,
    fetchComments: fetchCommentsPawchive,
    fetchPostRevisions: fetchPostRevisionsPawchive,
    lookupHash: lookupHashPawchive,
    flagPost: flagPostPawchive
  };
  function getApiAdapter() {
    const hostname = window.location.hostname;
    if (hostname.includes("pawchive")) {
      return pawchiveApiAdapter;
    }
    return kemonoApiAdapter;
  }
  function getPostDetailsFromPage() {
    var _a2, _b2, _c, _d, _e, _f;
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
    const authorName = ((_b2 = (_a2 = document.querySelector(".post__user-name")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || ((_d = (_c = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "UnknownAuthor";
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
    var _a2, _b2, _c, _d;
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
    const postTitle = ((_b2 = (_a2 = cardNode.querySelector(".post-card__header")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UntitledPost";
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
      author_name: postDetails.authorName || "UnknownAuthor",
      post_title: postDetails.postTitle || "UntitledPost",
      post_id: postDetails.postID || "0",
      user_id: postDetails.userID || "0",
      service: postDetails.service || "unknown",
      ...fileData
    };
    let result = formatNameFromTemplate(template, combinedData);
    if (!result || !result.trim() || result === "/") {
      const fallbackName = fileData.original_file_name || fileData.file_name || `file_${fileData.file_index || Date.now()}`;
      result = sanitizeFilename(fallbackName);
    }
    return result;
  }
  function getWindowPageData(targetPostID) {
    var _a2;
    try {
      const winData = window.page_data;
      if (winData) {
        const post = winData.post || ((_a2 = winData.props) == null ? void 0 : _a2.post) || (Array.isArray(winData) ? winData[0] : winData);
        if (post && post.id && (!targetPostID || String(post.id) === String(targetPostID))) {
          return post;
        }
      }
    } catch (e) {
      debugLog("Failed to read page_data from window", e);
    }
    return null;
  }
  async function collectFilesForPost(postDetails, options = {}) {
    var _a2;
    await getSettings();
    const files = [];
    let isApiSuccess = false;
    let rawApiData = null;
    const isPostPage = window.location.pathname.includes("/post/");
    const templateToUse = options.template && options.template.trim() || state.settings.fileNameTemplate && state.settings.fileNameTemplate.trim() || "{post_date}_{author_name}_{post_title}_{post_id}/{file_index}_{file_name}";
    if (!options.isBulk && !options.noFiles) {
      resetMediaCounter();
    }
    if (state.settings.enableAPIFetch && postDetails.service !== "unknown" && postDetails.userID !== "unknown" && postDetails.postID !== "unknown") {
      try {
        const cacheKey = `post_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        const windowPost = getWindowPageData(postDetails.postID);
        if (windowPost) {
          rawApiData = windowPost;
          console.log(`[Kemono DL] Post metadata loaded directly from window.page_data: ${postDetails.postID}`);
        } else {
          const cached = await getCachedPost(cacheKey);
          if (cached) {
            rawApiData = cached;
            console.log(`[Kemono DL] Post metadata loaded from IndexedDB cache: ${cacheKey}`);
          } else {
            console.log(`[Kemono DL] Fetching post metadata from API: ${postDetails.service}/${postDetails.userID}/${postDetails.postID}...`);
            rawApiData = await getApiAdapter().fetchPostData(postDetails.service, postDetails.userID, postDetails.postID);
            if (rawApiData) await setCachedPost(cacheKey, rawApiData);
          }
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
      if ((_a2 = post.file) == null ? void 0 : _a2.path) {
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
        const isMedia = isMediaFile(fileObj.name);
        files.push({ name: finalPath, data: resolveMediaUrl(fileObj.path, fileObj.name), source: "url", isMedia });
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
        var _a3;
        const href = node.getAttribute("href");
        if (!href) return;
        appState.globalMediaCounter++;
        localMediaCounter++;
        const originalName = node.getAttribute("download") || ((_a3 = href.split("/").pop()) == null ? void 0 : _a3.split("?")[0]) || "file";
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
        const tagsCacheKey = `tags_${postDetails.service}_${postDetails.userID}`;
        let tagsData = await getCachedPost(tagsCacheKey);
        if (!tagsData) {
          tagsData = await getApiAdapter().fetchTags(postDetails.service, postDetails.userID);
          if (tagsData && tagsData.length > 0) {
            await setCachedPost(tagsCacheKey, tagsData);
          }
        }
        if (Array.isArray(tagsData) && tagsData.length > 0) {
          const tagsPath = generateFilePath(templateToUse, { file_index: "tags", file_name: "tags.txt" }, postDetails);
          files.push({ name: tagsPath, data: tagsData.join("\n"), source: "text" });
        }
      } catch (e) {
        debugLog("Failed to fetch tags", e);
      }
    }
    if (state.settings.savePostComments && isPostPage) {
      try {
        const commentsCacheKey = `comments_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
        let commentsData = await getCachedPost(commentsCacheKey);
        if (!commentsData) {
          commentsData = await getApiAdapter().fetchComments(postDetails.service, postDetails.userID, postDetails.postID);
          if (commentsData && commentsData.length > 0) {
            await setCachedPost(commentsCacheKey, commentsData);
          }
        }
        if (Array.isArray(commentsData) && commentsData.length > 0) {
          const commentsText = commentsData.map((c) => `[${c.published || "N/A"}] ${c.commenter_name || "User"}: ${c.content}`).join("\n\n");
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
    } catch (err2) {
      console.error("Failed to pre-cache post files:", err2);
    }
  }
  var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0), revfd = _b.r;
  var rev = new u16(32768);
  for (var i = 0; i < 32768; ++i) {
    var x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var hMap = function(cd, mb, r) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (var i = 0; i < 144; ++i)
    flt[i] = 8;
  for (var i = 144; i < 256; ++i)
    flt[i] = 9;
  for (var i = 256; i < 280; ++i)
    flt[i] = 7;
  for (var i = 280; i < 288; ++i)
    flt[i] = 8;
  var fdt = new u8(32);
  for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
  var flm = /* @__PURE__ */ hMap(flt, 9, 0);
  var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var wbits = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
  };
  var wbits16 = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
  };
  var hTree = function(d, mb) {
    var t = [];
    for (var i2 = 0; i2 < d.length; ++i2) {
      if (d[i2])
        t.push({ s: i2, f: d[i2] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
      return { t: et, l: 0 };
    if (s == 1) {
      var v = new u8(t[0].s + 1);
      v[t[0].s] = 1;
      return { t: v, l: 1 };
    }
    t.sort(function(a, b) {
      return a.f - b.f;
    });
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
    t[0] = { s: -1, f: l.f + r.f, l, r };
    while (i1 != s - 1) {
      l = t[t[i0].f < t[i22].f ? i0++ : i22++];
      r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
      t[i1++] = { s: -1, f: l.f + r.f, l, r };
    }
    var maxSym = t2[0].s;
    for (var i2 = 1; i2 < s; ++i2) {
      if (t2[i2].s > maxSym)
        maxSym = t2[i2].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i2 = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t2.sort(function(a, b) {
        return tr[b.s] - tr[a.s] || a.f - b.f;
      });
      for (; i2 < s; ++i2) {
        var i2_1 = t2[i2].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t2[i2].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i2;
      }
      for (; i2 >= 0 && dt; --i2) {
        var i2_3 = t2[i2].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n, l, d) {
    return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
  };
  var lc = function(c) {
    var s = c.length;
    while (s && !c[--s])
      ;
    var cl = new u16(++s);
    var cli = 0, cln = c[0], cls = 1;
    var w = function(v) {
      cl[cli++] = v;
    };
    for (var i2 = 1; i2 <= s; ++i2) {
      if (c[i2] == cln && i2 != s)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (; cls > 138; cls -= 138)
            w(32754);
          if (cls > 2) {
            w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w(cln), --cls;
          for (; cls > 6; cls -= 6)
            w(8304);
          if (cls > 2)
            w(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w(cln);
        cls = 1;
        cln = c[i2];
      }
    }
    return { c: cl.subarray(0, cli), n: s };
  };
  var clen = function(cf, cl) {
    var l = 0;
    for (var i2 = 0; i2 < cl.length; ++i2)
      l += cf[i2] * cl[i2];
    return l;
  };
  var wfblk = function(out, pos, dat) {
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i2 = 0; i2 < s; ++i2)
      out[o + i2 + 4] = dat[i2];
    return (o + 4 + s) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i2 = 0; i2 < lclt.length; ++i2)
      ++lcfreq[lclt[i2] & 31];
    for (var i2 = 0; i2 < lcdt.length; ++i2)
      ++lcfreq[lcdt[i2] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
      var llm = hMap(lct, mlcb, 0);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i2 = 0; i2 < nlcc; ++i2)
        wbits(out, p + 3 * i2, lct[clim[i2]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0; it < 2; ++it) {
        var clct = lcts[it];
        for (var i2 = 0; i2 < clct.length; ++i2) {
          var len = clct[i2] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i2 = 0; i2 < li; ++i2) {
      var sym = syms[i2];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n = opt >> 13, c = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i3) {
        return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25e3);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (; i2 + 2 < s; ++i2) {
        var hv = hsh(i2);
        var imod = i2 & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i2) {
          var rem = s - i2;
          if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
            li = lc_1 = eb = 0, bs = i2;
            for (var j = 0; j < 286; ++j)
              lf[j] = 0;
            for (var j = 0; j < 30; ++j)
              df[j] = 0;
          }
          var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i2 - dif)) {
            var maxn = Math.min(n, rem) - 1;
            var maxd = Math.min(32767, i2);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i2 + l] == dat[i2 + l - dif]) {
                var nl = 0;
                for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                  ;
                if (nl > l) {
                  l = nl, d = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j = 0; j < mmd; ++j) {
                    var ti = i2 - dif + j & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d) {
            syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
            var lin = revfl[l] & 31, din = revfd[d] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i2 + l;
            ++lc_1;
          } else {
            syms[li++] = dat[i2];
            ++lf[dat[i2]];
          }
        }
      }
      for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
        syms[li++] = dat[i2];
        ++lf[dat[i2]];
      }
      pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i2, st.w = wi;
      }
    } else {
      for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
        var e = i2 + 65535;
        if (e >= s) {
          w[pos / 8 | 0] = lst;
          e = s;
        }
        pos = wfblk(w, pos + 1, dat.subarray(i2, e));
      }
      st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
  };
  var crct = /* @__PURE__ */ function() {
    var t = new Int32Array(256);
    for (var i2 = 0; i2 < 256; ++i2) {
      var c = i2, k = 9;
      while (--k)
        c = (c & 1 && -306674912) ^ c >>> 1;
      t[i2] = c;
    }
    return t;
  }();
  var crc = function() {
    var c = -1;
    return {
      p: function(d) {
        var cr = c;
        for (var i2 = 0; i2 < d.length; ++i2)
          cr = crct[cr & 255 ^ d[i2]] ^ cr >>> 8;
        c = cr;
      },
      d: function() {
        return ~c;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var mrg = function(a, b) {
    var o = {};
    for (var k in a)
      o[k] = a[k];
    for (var k in b)
      o[k] = b[k];
    return o;
  };
  var wbytes = function(d, b, v) {
    for (; v; ++b)
      d[b] = v, v >>>= 8;
  };
  function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
  }
  var fltn = function(d, p, t, o) {
    for (var k in d) {
      var val = d[k], n = p + k, op = o;
      if (Array.isArray(val))
        op = mrg(o, val[1]), val = val[0];
      if (ArrayBuffer.isView(val))
        t[n] = [val, op];
      else {
        t[n += "/"] = [new u8(0), op];
        fltn(val, n, t, o);
      }
    }
  };
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  function strToU8(str, latin1) {
    var i2;
    if (te)
      return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
      ar[ai++] = v;
    };
    for (var i2 = 0; i2 < l; ++i2) {
      if (ai + 5 > ar.length) {
        var n = new u8(ai + 8 + (l - i2 << 1));
        n.set(ar);
        ar = n;
      }
      var c = str.charCodeAt(i2);
      if (c < 128 || latin1)
        w(c);
      else if (c < 2048)
        w(192 | c >> 6), w(128 | c & 63);
      else if (c > 55295 && c < 57344)
        c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
      else
        w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }
  var exfl = function(ex) {
    var le = 0;
    if (ex) {
      for (var k in ex) {
        var l = ex[k].length;
        if (l > 65535)
          err(9);
        le += l + 4;
      }
    }
    return le;
  };
  var wzh = function(d, b, f, fn, u, c, ce, co) {
    var fl2 = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
    if (ce != null)
      d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2;
    d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
      err(10);
    wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
    if (c != -1) {
      wbytes(d, b, f.crc);
      wbytes(d, b + 4, c < 0 ? -c - 2 : c);
      wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl2);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
      wbytes(d, b, col);
      wbytes(d, b + 6, f.attrs);
      wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl2;
    if (exl) {
      for (var k in ex) {
        var exf = ex[k], l = exf.length;
        wbytes(d, b, +k);
        wbytes(d, b + 2, l);
        d.set(exf, b + 4), b += 4 + l;
      }
    }
    if (col)
      d.set(co, b), b += col;
    return b;
  };
  var wzf = function(o, b, c, d, e) {
    wbytes(o, b, 101010256);
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
  };
  function zipSync(data, opts) {
    if (!opts)
      opts = {};
    var r = {};
    var files = [];
    fltn(data, "", r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
      var _a2 = r[fn], file = _a2[0], p = _a2[1];
      var compression = p.level == 0 ? 0 : 8;
      var f = strToU8(fn), s = f.length;
      var com = p.comment, m = com && strToU8(com), ms = m && m.length;
      var exl = exfl(p.extra);
      if (s > 65535)
        err(11);
      var d = compression ? deflateSync(file, p) : file, l = d.length;
      var c = crc();
      c.p(file);
      files.push(mrg(p, {
        size: file.length,
        crc: c.d(),
        c: d,
        f,
        m,
        u: s != fn.length || m && com.length != ms,
        o,
        compression
      }));
      o += 30 + s + exl + l;
      tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i2 = 0; i2 < files.length; ++i2) {
      var f = files[i2];
      wzh(out, f.o, f, f.f, f.u, f.c.length);
      var badd = 30 + f.f.length + exfl(f.extra);
      out.set(f.c, f.o + badd);
      wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
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
    task.updateStatus("Fetching post metadata...");
    console.log(`[Kemono DL] Initiating ZIP task for post ${postDetails.postID}: "${postDetails.postTitle}"`);
    try {
      const isPostPage = window.location.pathname.includes("/post/");
      const { files: rawFiles } = isPostPage && appState.cachedPostFiles ? { files: appState.cachedPostFiles } : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
      const ignoredExts = state.settings.ignoredFileExtensions || [];
      const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
      if (files.length === 0) throw new Error("No content to ZIP (all files filtered or empty).");
      let successCount = 0;
      let failCount = 0;
      const urlFiles = files.filter((t) => t.source === "url");
      const totalUrlFiles = urlFiles.length;
      console.log(`[Kemono DL] Total files collected: ${files.length} (${totalUrlFiles} URLs, ${files.length - totalUrlFiles} text items)`);
      task.updateStatus(`Downloading ${totalUrlFiles} files...`);
      const zippable = {};
      files.forEach((file) => {
        if (file.source === "text") {
          const textContent = typeof file.data === "string" ? file.data : JSON.stringify(file.data || "");
          const cleanName = file.name.replace(/^\/+/, "");
          console.log(`[Kemono DL] Adding text file to ZIP: "${cleanName}" (${textContent.length} chars)`);
          zippable[cleanName] = strToU8(textContent);
        }
      });
      const concurrency = Math.max(1, state.settings.maxConcurrentFileDownloadsInZip || 3);
      let queueIndex = 0;
      async function downloadWorker() {
        var _a2;
        while (queueIndex < totalUrlFiles) {
          const i2 = queueIndex++;
          const file = urlFiles[i2];
          const fileTaskId = `${postDetails.postID}-${i2}`;
          task.addFile(fileTaskId, file.name);
          try {
            console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Starting download: ${file.name} (${file.data})`);
            const cachedData = await getCachedFile(file.data);
            let arrayBuffer;
            if (cachedData) {
              console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Loaded from cache: ${file.name}`);
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
                console.log(`[Kemono DL] [File ${i2 + 1}/${totalUrlFiles}] Downloaded successfully (${arrayBuffer.byteLength} bytes). Saving to cache.`);
                await setCachedFile(file.data, arrayBuffer, true);
              }
            }
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
              let cleanName = (file.name || "").replace(/^\/+/, "").trim();
              if (!cleanName) {
                try {
                  const urlFileName = ((_a2 = file.data.split("/").pop()) == null ? void 0 : _a2.split("?")[0]) || `file_${i2 + 1}.bin`;
                  cleanName = sanitizeFilename(decodeURIComponent(urlFileName));
                } catch (e) {
                  cleanName = `file_${i2 + 1}.bin`;
                }
              }
              if (zippable[cleanName]) {
                const ext = cleanName.includes(".") ? cleanName.split(".").pop() : "";
                const base = cleanName.substring(0, cleanName.length - (ext ? ext.length + 1 : 0));
                cleanName = `${base}_${i2 + 1}${ext ? "." + ext : ""}`;
              }
              console.log(`[Kemono DL] Adding binary file to ZIP: "${cleanName}" (${arrayBuffer.byteLength} bytes)`);
              zippable[cleanName] = new Uint8Array(arrayBuffer);
              task.markFileComplete(fileTaskId, true);
            } else {
              throw new Error("Downloaded file ArrayBuffer is empty");
            }
          } catch (error) {
            failCount++;
            console.error(`[Kemono DL Error] File ${i2 + 1} download failed for URL "${file.data}":`, error);
            task.markFileComplete(fileTaskId, false);
            const sanitizedBase = sanitizeFilename(file.name.split("/").pop() || "file");
            zippable[`failed_${sanitizedBase}.txt`] = strToU8(`Failed to download file.
URL: ${file.data}
Error: ${(error == null ? void 0 : error.message) || error}`);
          } finally {
            successCount++;
            task.updateStatus(`Downloading... ${successCount}/${totalUrlFiles} done`);
          }
        }
      }
      const workers = Array.from({ length: Math.min(concurrency, totalUrlFiles) }, () => downloadWorker());
      await Promise.all(workers);
      console.log(`[Kemono DL] All downloads finished. Succeeded: ${successCount - failCount}, Failed: ${failCount}. Total entries in zippable:`, Object.keys(zippable).length);
      if (totalUrlFiles > 0 && failCount === totalUrlFiles) {
        throw new Error("All file downloads failed");
      }
      task.updateStatus("Zipping...");
      const zipName = sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`);
      const level = Number(state.settings.zipCompressionLevel) || 0;
      console.log(`[Kemono DL] Calling fflate zipSync (level ${level}) for "${zipName}"...`);
      const zipStartTime = Date.now();
      const zippedData = zipSync(zippable, { level });
      const duration = Date.now() - zipStartTime;
      console.log(`[Kemono DL] fflate zipSync (level ${level}) completed in ${duration}ms! ZIP size: ${zippedData.byteLength} bytes (${(zippedData.byteLength / 1024 / 1024).toFixed(2)} MB)`);
      const blob = new Blob([zippedData], { type: "application/zip" });
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
      let targetFiles = files.filter((f) => f.source === "url" && (type === "Images" ? f.isMedia : !f.isMedia));
      if (type === "Attachments" && targetFiles.length === 0) {
        targetFiles = files.filter((f) => f.source === "url");
      }
      if (targetFiles.length === 0) {
        task.updateStatus(`No ${type.toLowerCase()} to download.`);
        task.finish(3e3);
        return;
      }
      task.updateStatus(`Starting download of ${targetFiles.length} files...`);
      for (let i2 = 0; i2 < targetFiles.length; i2++) {
        const file = targetFiles[i2];
        const fileTaskId = `indiv-${i2}`;
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
        task.updateStatus(`Triggered ${i2 + 1}/${targetFiles.length}`);
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
      const { files: rawFiles } = await collectFilesForPost(details, {
        isBulk: false,
        template: "{file_index}_{file_name}"
      });
      const ignoredExts = state.settings.ignoredFileExtensions || [];
      const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
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
    var _a2;
    const task = progressManager.createTask(`bulk-single-${Date.now()}`, `Bulk Archive (${postIds.length} Posts)`);
    resetMediaCounter();
    try {
      const zip = new JSZip();
      let htmlIndexString = "";
      if (state.settings.addHtmlIndexInZip) {
        htmlIndexString = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${sanitizeFilename(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${sanitizeFilename(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>`;
      }
      for (let i2 = 0; i2 < postIds.length; i2++) {
        const postId = postIds[i2];
        const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
        if (!postCard) continue;
        const postDetails = getPostCardDetails(postCard, authorName);
        task.updateStatus(`[${i2 + 1}/${postIds.length}] Fetching: ${postDetails.postTitle}`);
        const { files: rawFiles } = await collectFilesForPost(postDetails, {
          isBulk: true,
          bulk_post_index: i2 + 1,
          template: state.settings.bulkSingleInternalPathTemplate
        });
        const ignoredExts = state.settings.ignoredFileExtensions || [];
        const files = rawFiles.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
        if (state.settings.addHtmlIndexInZip) {
          const postLink = ((_a2 = postCard.querySelector("a")) == null ? void 0 : _a2.href) || "#";
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
          task.updateStatus(`[${i2 + 1}/${postIds.length}] Downloading ${urlFiles.length} files for ${postDetails.postTitle}`);
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
                const fileTaskId = `bulk-${i2}-${fileIndex}`;
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
    for (let i2 = 0; i2 < postIds.length; i2++) {
      const postId = postIds[i2];
      const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`);
      if (!postCard) continue;
      const postDetails = getPostCardDetails(postCard, authorName);
      const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
      postDetails.postDate = postDate;
      addTaskToQueue("Bulk-Single-Zip", downloadPostAsZip, postDetails, null);
      task.updateStatus(`Queued ${i2 + 1}/${postIds.length} posts...`);
    }
    task.updateStatus("All posts queued! Downloads will start based on concurrency settings.");
    task.finish(3e3);
  }
  async function executeBulkDownload(postIdsOrEvent = null) {
    var _a2, _b2, _c;
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
    const sortOrder = ((_a2 = document.getElementById("kdl-bulk-sort-order")) == null ? void 0 : _a2.value) || "selection";
    let postIdsArray = Array.from(postIdsToProcess);
    if (sortOrder === "oldest") {
      postIdsArray.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    } else if (sortOrder === "newest") {
      postIdsArray.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }
    const authorName = ((_c = (_b2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _b2.textContent) == null ? void 0 : _c.trim()) || "UnknownAuthor";
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
        } catch (err2) {
          debugLog("Share cancelled or failed:", err2);
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
    var _a2, _b2, _c, _d, _e;
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
    const candidates = (_a2 = response.response) == null ? void 0 : _a2.candidates;
    if (candidates && ((_e = (_d = (_c = (_b2 = candidates[0]) == null ? void 0 : _b2.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) {
      return candidates[0].content.parts[0].text.trim();
    }
    throw new Error("Invalid response structure from Gemini API");
  }
  async function executeDeepLTranslation(text) {
    var _a2, _b2;
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
    const translations = (_a2 = response.response) == null ? void 0 : _a2.translations;
    if (translations && ((_b2 = translations[0]) == null ? void 0 : _b2.text)) {
      return translations[0].text.trim();
    }
    throw new Error("Invalid response structure from DeepL API");
  }
  async function createAndInsertPostPageButtons(container, referenceElement) {
    await getSettings();
    document.querySelectorAll(".kdl-actions-container, .kdl-button").forEach((node) => node.remove());
    const postDetails = getPostDetailsFromPage();
    const createButton = (text, title, bgGradient, onClick, onContext) => {
      return el(
        "button",
        {
          className: "kdl-button",
          title,
          style: {
            padding: "7px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.86rem",
            fontWeight: "600",
            color: "#fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            background: bgGradient,
            width: "100%",
            boxSizing: "border-box",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          },
          onClick,
          onContextMenu: onContext
        },
        [text]
      );
    };
    const toolsCol = el("div", { className: "kdl-actions-col kdl-actions-tools" });
    const downloadsCol = el("div", { className: "kdl-actions-col kdl-actions-downloads" });
    if (state.settings.showCopyLinksButton) {
      toolsCol.appendChild(
        createButton(
          "📋 Copy Links",
          "Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.",
          "linear-gradient(135deg, #06b6d4, #0891b2)",
          (e) => executeLinkAction("copy-aria", postDetails, e.target),
          (e) => {
            e.preventDefault();
            executeLinkAction("download-txt", postDetails, e.target);
          }
        )
      );
    }
    if (state.settings.showShareButton && typeof navigator.share === "function") {
      toolsCol.appendChild(
        createButton(
          "🔗 Share Links",
          "Share Links",
          "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          (e) => executeLinkAction("share", postDetails, e.target)
        )
      );
    }
    if (state.settings.showTranslateButton && state.settings.translationProvider !== "none" && (state.settings.geminiApiKey || state.settings.deeplApiKey)) {
      toolsCol.appendChild(createButton("📝 Translate", "Translate", "linear-gradient(135deg, #6366f1, #4f46e5)", (e) => executeTranslation(e.target)));
    }
    if (state.settings.showImagesButton) {
      downloadsCol.appendChild(
        createButton(
          "🖼️ Download Images",
          "Download Images",
          "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          (e) => addTaskToQueue("Images", (pd) => executeIndividualDownload("Images", pd), postDetails, e.target, "🖼️ Download Images")
        )
      );
    }
    if (state.settings.showFilesButton) {
      const btn = createButton(
        "📎 Download Attachments",
        "Download Attachments",
        "linear-gradient(135deg, #f59e0b, #d97706)",
        (e) => addTaskToQueue("Attachments", (pd) => executeIndividualDownload("Attachments", pd), postDetails, e.target, "📎 Download Attachments")
      );
      btn.style.color = "#ffffff";
      downloadsCol.appendChild(btn);
    }
    if (state.settings.showZipButton) {
      downloadsCol.appendChild(
        createButton(
          "📦 Download (ZIP)",
          "Download (ZIP)",
          "linear-gradient(135deg, #10b981, #047857)",
          (e) => addTaskToQueue("ZIP", executeZipDownload, postDetails, e.target, "📦 Download (ZIP)")
        )
      );
    }
    const kdlContainer = el("div", { className: "kdl-actions-container" }, [toolsCol, downloadsCol]);
    container.appendChild(kdlContainer);
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
      const attachments = files.filter((t) => t.source === "url");
      if (attachments.length === 0) {
        modal.replaceChildren(el("h4", {}, ["No attachments found for this post."]));
        return;
      }
      const list = el("ul", { id: "kdl-file-picker-list" });
      attachments.forEach((file) => {
        const fileName = file.name.split("/").pop() || file.name;
        const a = el("a", { href: "#", dataset: { url: file.data, name: file.name } }, [fileName]);
        list.appendChild(el("li", {}, [a]));
      });
      list.addEventListener("click", (e) => {
        e.preventDefault();
        const link = e.target.closest("a");
        if (link) {
          const fullPath = link.dataset.name;
          const fileName = fullPath.split("/").pop() || fullPath;
          showMessage(`Starting download for ${fileName}`, "info");
          GM_download({ url: link.dataset.url, name: fileName, saveAs: false });
          overlay.remove();
        }
      });
      modal.replaceChildren(el("h4", {}, [`Select a file to download (${attachments.length})`]), list);
    } catch (error) {
      modal.replaceChildren(
        el("h4", {}, ["Failed to load attachments."]),
        el("p", { style: { color: "#ccc", fontSize: "0.9em" } }, [error.message])
      );
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
          tooltip.textContent = postCardNode.dataset.postInfo;
          return;
        }
        if (isFetching) return;
        isFetching = true;
        tooltip.replaceChildren(el("em", {}, ["Loading..."]));
        try {
          const apiResponse = await fetchPostDataFromAPI(details.service, details.userID, details.postID);
          const post = (apiResponse == null ? void 0 : apiResponse.post) || (Array.isArray(apiResponse) ? apiResponse[0] : apiResponse);
          if (!post) throw new Error("No post data");
          const fileCount = post.file ? 1 : 0;
          const attachmentCount = post.attachments ? post.attachments.length : 0;
          const totalFiles = fileCount + attachmentCount;
          const infoText = `Title: ${post.title}
Published: ${new Date(post.published).toLocaleDateString()}
Total Files: ${totalFiles} (${attachmentCount} attachments, ${fileCount} main file)`;
          tooltip.textContent = infoText;
          postCardNode.dataset.postInfo = infoText;
        } catch (err2) {
          tooltip.replaceChildren(el("em", {}, ["Failed to load info."]));
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
    var _a2, _b2, _c, _d;
    if (!card) return;
    const favBtn = card.querySelector(".kdl-quick-fav-btn");
    if (isFavorited) {
      if (favBtn) favBtn.classList.add("kdl-favorited");
      if (type === "creator") card.classList.add("user-card--fav");
      else {
        (_a2 = card.querySelector(".post-card__header")) == null ? void 0 : _a2.classList.add("post-card__header--fav");
        (_b2 = card.querySelector(".post-card__footer")) == null ? void 0 : _b2.classList.add("post-card__footer--fav");
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
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, ["⭐"]);
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
    const favBtn = el("button", { className: "kdl-quick-fav-btn", title: "Toggle Favorite" }, ["⭐"]);
    cardNode.appendChild(favBtn);
    updateCardFavoriteState(cardNode, isFavorited, "post");
    favBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn, "post", service, creatorId, postId, updateCardFavoriteState);
    });
  }
  let lastCheckedIndex = null;
  function updateSelectionState() {
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    appState.selectedPostIds.clear();
    postCards.forEach((card) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (checkbox && checkbox.checked) {
        appState.selectedPostIds.add(checkbox.dataset.id);
      }
    });
    const selectedCount = appState.selectedPostIds.size;
    const btn = document.getElementById("kdl-bulk-download-btn");
    const panel = document.getElementById("kdl-bulk-panel");
    if (btn) {
      btn.textContent = `Download Selected (${selectedCount})`;
      btn.disabled = selectedCount === 0;
    }
    if (panel) {
      if (selectedCount > 0) {
        panel.classList.add("kdl-visible");
      } else {
        panel.classList.remove("kdl-visible");
      }
    }
  }
  function initializeShiftClickLogic() {
    const postCards = Array.from(document.querySelectorAll("article.post-card[data-id]"));
    if (postCards.length === 0) return;
    postCards.forEach((card, index) => {
      const checkbox = card.querySelector(".kdl-post-checkbox");
      if (!checkbox) return;
      card.addEventListener(
        "click",
        (event) => {
          if (!event.shiftKey) return;
          const target = event.target;
          if (target.closest(".post-card-download-controls")) return;
          event.preventDefault();
          event.stopPropagation();
          const desiredState = !checkbox.checked;
          checkbox.checked = desiredState;
          if (lastCheckedIndex !== null) {
            const start = Math.min(index, lastCheckedIndex);
            const end = Math.max(index, lastCheckedIndex);
            for (let i2 = start; i2 <= end; i2++) {
              const cb = postCards[i2].querySelector(".kdl-post-checkbox");
              if (cb) cb.checked = desiredState;
            }
          }
          lastCheckedIndex = index;
          updateSelectionState();
        },
        true
      );
      checkbox.addEventListener("click", (event) => {
        if (event.shiftKey && lastCheckedIndex !== null) {
          const start = Math.min(index, lastCheckedIndex);
          const end = Math.max(index, lastCheckedIndex);
          const targetChecked = checkbox.checked;
          for (let i2 = start; i2 <= end; i2++) {
            const cb = postCards[i2].querySelector(".kdl-post-checkbox");
            if (cb) cb.checked = targetChecked;
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
    updateSelectionState();
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
    document.body.appendChild(panel);
  }
  async function launchAuthorManager(forceRefresh = false) {
    var _a2, _b2;
    let overlay = document.getElementById("kdl-author-manager-overlay");
    if (!overlay) {
      overlay = el("div", { id: "kdl-author-manager-overlay" }, [
        el("div", { id: "kdl-author-manager-modal" }, [
          el("div", { id: "kdl-manager-header" }, [
            el("h3", { id: "kdl-manager-title" }),
            el("em", { id: "kdl-manager-cache-status", style: { fontSize: "0.8em", color: "#aaa", marginLeft: "10px" } })
          ]),
          el("div", { id: "kdl-manager-controls", style: { flexWrap: "wrap" } }, [
            el("button", { id: "kdl-manager-refresh", className: "kdl-manager-btn", title: "Force Refresh", style: { backgroundColor: "#17a2b8" } }, ["🔄"]),
            el("input", { type: "text", id: "kdl-manager-search", placeholder: "Search by title..." }),
            el("select", { id: "kdl-manager-sort", className: "kdl-manager-btn", style: { padding: "8px 6px" } }, [
              el("option", { value: "date-desc" }, ["Newest First"]),
              el("option", { value: "date-asc" }, ["Oldest First"]),
              el("option", { value: "files-desc" }, ["Most Files"]),
              el("option", { value: "files-asc" }, ["Fewest Files"]),
              el("option", { value: "title-asc" }, ["Title (A-Z)"]),
              el("option", { value: "title-desc" }, ["Title (Z-A)"])
            ]),
            el("button", { id: "kdl-manager-select-all", className: "kdl-manager-btn", style: { backgroundColor: "#007bff" } }, ["Select Visible"]),
            el("button", { id: "kdl-manager-deselect-all", className: "kdl-manager-btn", style: { backgroundColor: "#dc3545" } }, ["Deselect All"])
          ]),
          el("div", { id: "kdl-manager-post-list" }),
          el("div", { id: "kdl-manager-footer" }, [
            el("span", { id: "kdl-manager-counter" }, ["Selected: 0"]),
            el("div", {}, [
              el("button", { id: "kdl-manager-download", className: "kdl-manager-btn", style: { backgroundColor: "#28a745" }, disabled: true }, ["Download Selected"]),
              el("button", { id: "kdl-manager-close", className: "kdl-manager-btn", style: { backgroundColor: "#6c757d" } }, ["Close"])
            ])
          ])
        ])
      ]);
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
    const authorName = ((_b2 = (_a2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UnknownAuthor";
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
    listContainer.replaceChildren(el("p", { style: { textAlign: "center", padding: "20px" } }, ["Fetching all post data from API..."]));
    const allPosts = await getApiAdapter().fetchAllAuthorPosts(service, userID);
    if (allPosts.length > 0) {
      if (state.settings.cacheDurationHours > 0) {
        await GM_setValue(cacheKey, { timestamp: Date.now(), postList: allPosts });
      }
      title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
      populateManagerList(allPosts);
      setupManagerEventListeners();
    } else {
      title.textContent = `Failed to load posts for ${authorName}`;
      listContainer.replaceChildren(el("p", { style: { textAlign: "center", padding: "20px" } }, ["Could not retrieve post list."]));
    }
  }
  function populateManagerList(posts) {
    const listContainer = document.getElementById("kdl-manager-post-list");
    const fragment = document.createDocumentFragment();
    posts.forEach((post) => {
      var _a2, _b2;
      const postDate = post.published ? new Date(post.published).toISOString().split("T")[0] : "No Date";
      const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);
      const mainFilePath = ((_a2 = post.file) == null ? void 0 : _a2.path) || Array.isArray(post.attachments) && ((_b2 = post.attachments[0]) == null ? void 0 : _b2.path);
      let previewElem;
      if (mainFilePath) {
        const thumbUrl = getThumbnailUrl(mainFilePath);
        previewElem = el("img", { src: thumbUrl, className: "post-item-preview", loading: "lazy" });
      } else {
        previewElem = el("div", { className: "post-item-preview" });
      }
      const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);
      const item = el(
        "div",
        {
          className: "post-item",
          dataset: {
            id: post.id,
            title: post.title.toLowerCase(),
            date: post.published || "0",
            files: String(fileCount)
          }
        },
        [
          previewElem,
          el("input", { type: "checkbox", dataset: { id: post.id } }),
          el("div", { className: "post-item-label" }, [
            el("span", { className: "post-item-title" }, [sanitizeFilename(post.title)]),
            el("span", { className: "post-item-date" }, [`${postDate} | Files: ${fileCount} | ID: ${post.id}`])
          ]),
          el("a", { href: postUrl, target: "_blank", className: "post-item-open-link", title: "Open post in new tab" }, ["↗️"])
        ]
      );
      fragment.appendChild(item);
    });
    listContainer.replaceChildren(fragment);
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
      const desiredState = target.tagName === "INPUT" ? checkbox.checked : !checkbox.checked;
      checkbox.checked = desiredState;
      if (e.shiftKey && lastCheckedIndex2 !== null) {
        const start = Math.min(currentIndex, lastCheckedIndex2);
        const end = Math.max(currentIndex, lastCheckedIndex2);
        for (let i2 = start; i2 <= end; i2++) {
          checkboxes[i2].checked = desiredState;
        }
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
        className: "user-header__manage",
        type: "button",
        title: "Load all posts from this author into a powerful manager with search and bulk selection.",
        onClick: () => launchAuthorManager()
      },
      [
        el("span", { className: "user-header__fav-icon" }, ["🗂️"]),
        el("span", { className: "user-header__fav-text" }, ["Manage All Posts"])
      ]
    );
  }
  function ensureStylesInjected() {
    if (document.getElementById("kdl-global-styles")) return;
    if (typeof GM_addStyle === "function") {
      const styleNode = GM_addStyle(CSS_STYLES);
      if (styleNode && typeof styleNode.setAttribute === "function") {
        styleNode.setAttribute("id", "kdl-global-styles");
      }
    } else {
      const styleNode = document.createElement("style");
      styleNode.id = "kdl-global-styles";
      styleNode.textContent = CSS_STYLES;
      (document.head || document.documentElement).appendChild(styleNode);
    }
  }
  ensureStylesInjected();
  let lastUrl = "";
  let isInitializing = false;
  async function handlePageContent() {
    var _a2, _b2;
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
        if (header) {
          await createAndInsertPostPageButtons(header);
          fetchAndCachePostData();
        }
      } else if (path.includes("/user/")) {
        const userHeaderActions = document.querySelector(".user-header__actions");
        if (userHeaderActions) {
          userHeaderActions.prepend(createAuthorManagerButton());
        }
        createBulkDownloadPanel();
        const pageAuthorName = ((_b2 = (_a2 = document.querySelector('.user-header__name span[itemprop="name"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || "UnknownAuthor";
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
            var _a3;
            if (event.ctrlKey) {
              event.preventDefault();
              event.stopPropagation();
              (_a3 = card.querySelector(".kdl-post-checkbox")) == null ? void 0 : _a3.click();
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
    ensureStylesInjected();
    createFixedControls();
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
  exports.ensureStylesInjected = ensureStylesInjected;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
