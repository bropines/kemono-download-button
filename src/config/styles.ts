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
