export const CSS_STYLES = `
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
  gap: 6px !important;
  background-color: #2e3440 !important;
  color: #f1f5f9 !important;
  border: 1px solid #4c566a !important;
  border-radius: 4px !important;
  padding: 6px 12px !important;
  font-size: 14px !important;
  font-family: inherit !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  text-decoration: none !important;
  line-height: 1.4 !important;
  height: auto !important;
  box-sizing: border-box !important;
}

.user-header__manage:hover,
#kdl-author-manager-btn:hover {
  background-color: #6f42c1 !important;
  border-color: #6f42c1 !important;
  color: #ffffff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 10px rgba(111, 66, 193, 0.35) !important;
  outline: none !important;
  text-shadow: none !important;
}

.user-header__manage:hover span,
#kdl-author-manager-btn:hover span {
  color: #ffffff !important;
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
