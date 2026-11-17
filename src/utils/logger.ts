import { keepInHead } from '../core/page';
import { kuiState } from '../state/kuiState';

export const debugModule = {
  init() {
    if (document.getElementById("kui-debugger")) return;
    const debuggerOverlay = document.createElement("div");
    debuggerOverlay.id = "kui-debugger";
    const css = `
        #kui-debugger { display: none; position: fixed; bottom: 10px; left: 10px; background-color: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 99999; pointer-events: none; line-height: 1.5; }
        #kui-debugger.kui-active:not(:empty) { display: block; }
      `;
    let styled = false;
    try {
      const added = typeof GM_addStyle === "function" ? (GM_addStyle(css) as unknown) : null;
      if (added instanceof HTMLStyleElement) keepInHead(added);
      styled = !!added;
    } catch (e) {
      styled = false;
    }
    // Hosts without GM_addStyle (or where it returns nothing) get a plain <style>
    if (!styled) {
      const style = keepInHead(document.createElement("style"));
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
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
