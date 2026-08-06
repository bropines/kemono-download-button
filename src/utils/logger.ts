import { kuiState } from '../state/kuiState';

export const debugModule = {
  init() {
    if (document.getElementById("kui-debugger")) return;
    const debuggerOverlay = document.createElement("div");
    debuggerOverlay.id = "kui-debugger";
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(`
        #kui-debugger { display: none; position: fixed; bottom: 10px; left: 10px; background-color: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 99999; pointer-events: none; line-height: 1.5; }
        #kui-debugger.kui-active { display: block; }
      `);
    }
    document.body.appendChild(debuggerOverlay);
    if (kuiState.isDebugModeEnabled) this.show();
  },
  update(data: Record<string, any>) {
    if (!kuiState.isDebugModeEnabled) return;
    const overlay = document.getElementById("kui-debugger");
    if (!overlay) return;
    let content = "--- KUI DEBUGGER ---<br>";
    for (const key in data) {
      content += `${key.padEnd(18, " ")}: ${data[key]}<br>`;
    }
    overlay.innerHTML = content;
  },
  hide() {
    const overlay = document.getElementById("kui-debugger");
    if (overlay) overlay.classList.remove("kui-active");
  },
  show() {
    const overlay = document.getElementById("kui-debugger");
    if (overlay) overlay.classList.add("kui-active");
  }
};
