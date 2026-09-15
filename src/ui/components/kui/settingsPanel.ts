import { SELECTORS } from '../../../config/selectors';
import { kuiState, setDebugMode, setVerboseDebugMode, setPreloadImages, setHideEmptySections, setEmbedRules, setSessionKey } from '../../../state/kuiState';
import { debugModule } from '../../../utils/logger';
import { postPageModule } from '../../../features/kui/postPageModule';
import { hideEmptySections } from '../../../features/kui/embeds';
import { isAdBlockEnabled, setAdBlockEnabled } from '../../../features/adblock';
import { EmbedRules } from '../../../types';
import { setupNavigationSettings } from '../navigationSettings';

export function injectUI(): void {
  setupNavigationSettings();

  if (document.getElementById("kui-settings-panel")) return;

  const settingsPanel = document.createElement("div");
  settingsPanel.id = "kui-settings-panel";
  settingsPanel.innerHTML = `
      <div class="kui-settings-content">
          <h2>UI Settings</h2>
          <div class="kui-setting">
              <label for="sessionKeyInput">Session Key</label>
              <input type="text" id="sessionKeyInput" placeholder="Leave empty for auto-mode">
              <small>A fallback option if automatic file fetching fails. Paste the value of the 'session' cookie here.</small>
          </div>
          <div class="kui-setting">
              <label>Post Card Size</label>
              <div class="kui-grid-size-control">
                  <input type="range" id="gridSizeSlider" min="120" max="400">
                  <input type="number" id="gridSizeInput" min="120" max="400">
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="debugModeToggle">Debug Mode</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="debugModeToggle"><span class="kui-slider"></span>
                  </label>
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="verboseDebugToggle">Verbose Debug (in F12 console)</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="verboseDebugToggle"><span class="kui-slider"></span>
                  </label>
              </div>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="preloadImagesToggle">Preload gallery images</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="preloadImagesToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Enables background loading of all post images when the gallery is opened. May consume a lot of traffic.</small>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="hideEmptySectionsToggle">Hide empty post sections</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="hideEmptySectionsToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Automatically hides sections like Content or Comments if they contain no text, links, or comments.</small>
          </div>
          <div class="kui-setting">
              <div class="kui-toggle-switch">
                  <label for="hideAdsToggle">Hide site ads</label>
                  <label class="kui-switch">
                      <input type="checkbox" id="hideAdsToggle"><span class="kui-slider"></span>
                  </label>
              </div>
              <small>Hides banner, native and interstitial ad slots, and keeps the Pawchive popunder from loading on later page loads.</small>
          </div>
          <div class="kui-setting">
              <label>Embed Link Rules</label>
              <div class="kui-rule-input-group">
                  <input type="text" id="kui-rule-domain-input" placeholder="e.g., *.mega.nz">
                  <select id="kui-rule-action-select">
                      <option value="button">Convert to Button</option>
                      <option value="hide">Hide Link</option>
                  </select>
                  <button id="kui-add-rule-btn">+</button>
              </div>
              <div id="kui-rules-container"></div>
          </div>
      </div>
      <div class="kui-settings-footer">
          <button id="kui-save-rules-btn">Save Settings</button>
      </div>
  `;
  document.body.appendChild(settingsPanel);
  const toast = document.createElement("div");
  toast.id = "kui-save-toast";
  toast.textContent = "Saved!";
  document.body.appendChild(toast);

  let tempEmbedRules: EmbedRules = JSON.parse(JSON.stringify(kuiState.embedRules));
  let panelMousedownTarget: EventTarget | null = null;
  const domainInput = document.getElementById("kui-rule-domain-input") as HTMLInputElement;
  const actionSelect = document.getElementById("kui-rule-action-select") as HTMLSelectElement;
  const addBtn = document.getElementById("kui-add-rule-btn") as HTMLButtonElement;
  const rulesContainer = document.getElementById("kui-rules-container") as HTMLDivElement;
  const saveBtn = document.getElementById("kui-save-rules-btn") as HTMLButtonElement;
  const sessionKeyInput = document.getElementById("sessionKeyInput") as HTMLInputElement;

  if (sessionKeyInput) {
    sessionKeyInput.value = kuiState.sessionKey;
  }

  const renderRules = (rules: EmbedRules) => {
    if (!rulesContainer) return;
    rulesContainer.innerHTML = "";
    for (const domain in rules) {
      const action = rules[domain];
      const tag = document.createElement("div");
      tag.className = "kui-rule-tag";
      const actionText = action === "button" ? "Button" : "Hide";
      tag.innerHTML = `
              <span class="kui-rule-tag-action" data-domain="${domain}">${actionText}</span>:
              <span>${domain}</span>
              <span class="kui-rule-tag-delete" data-domain="${domain}">×</span>
          `;
      rulesContainer.appendChild(tag);
    }
  };

  const addRule = () => {
    if (!domainInput || !actionSelect) return;
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) return;
    tempEmbedRules[domain] = actionSelect.value;
    renderRules(tempEmbedRules);
    domainInput.value = "";
  };

  if (addBtn) addBtn.addEventListener("click", addRule);
  if (domainInput) {
    domainInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") addRule();
    });
  }

  if (rulesContainer) {
    rulesContainer.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const domain = target.dataset.domain;
      if (!domain) return;
      if (target.classList.contains("kui-rule-tag-delete")) {
        delete tempEmbedRules[domain];
      } else if (target.classList.contains("kui-rule-tag-action")) {
        tempEmbedRules[domain] = tempEmbedRules[domain] === "button" ? "hide" : "button";
      }
      renderRules(tempEmbedRules);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (sessionKeyInput) {
        setSessionKey(sessionKeyInput.value.trim());
      }
      setEmbedRules(JSON.parse(JSON.stringify(tempEmbedRules)));
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2000);
      if (kuiState.isPostPageModuleActive) {
        postPageModule.refreshContent();
      }
    });
  }

  document.addEventListener("mousedown", (e: MouseEvent) => {
    panelMousedownTarget = e.target;
  });

  document.addEventListener("mouseup", (e: MouseEvent) => {
    const sidebarButton = document.getElementById("kui-settings-btn-sidebar");
    const headerButton = document.getElementById("kui-settings-btn-header");
    if (
      settingsPanel.classList.contains("kui-panel-active") &&
      panelMousedownTarget instanceof Node &&
      !settingsPanel.contains(panelMousedownTarget) &&
      e.target instanceof Node &&
      !settingsPanel.contains(e.target) &&
      !(sidebarButton && e.target instanceof Node && sidebarButton.contains(e.target)) &&
      !(sidebarButton && panelMousedownTarget instanceof Node && sidebarButton.contains(panelMousedownTarget)) &&
      !(headerButton && e.target instanceof Node && headerButton.contains(e.target)) &&
      !(headerButton && panelMousedownTarget instanceof Node && headerButton.contains(panelMousedownTarget))
    ) {
      settingsPanel.classList.remove("kui-panel-active");
      tempEmbedRules = JSON.parse(JSON.stringify(kuiState.embedRules));
      renderRules(tempEmbedRules);
    }
    panelMousedownTarget = null;
  });

  const debugToggle = document.getElementById("debugModeToggle") as HTMLInputElement | null;
  if (debugToggle) {
    debugToggle.checked = kuiState.isDebugModeEnabled;
    debugToggle.addEventListener("change", () => {
      setDebugMode(debugToggle.checked);
      kuiState.isDebugModeEnabled ? debugModule.show() : debugModule.hide();
    });
  }

  const verboseDebugToggle = document.getElementById("verboseDebugToggle") as HTMLInputElement | null;
  if (verboseDebugToggle) {
    verboseDebugToggle.checked = kuiState.isVerboseDebugEnabled;
    verboseDebugToggle.addEventListener("change", () => {
      setVerboseDebugMode(verboseDebugToggle.checked);
    });
  }

  const hideEmptySectionsToggle = document.getElementById("hideEmptySectionsToggle") as HTMLInputElement | null;
  if (hideEmptySectionsToggle) {
    hideEmptySectionsToggle.checked = kuiState.isHideEmptySectionsEnabled;
    hideEmptySectionsToggle.addEventListener("change", () => {
      setHideEmptySections(hideEmptySectionsToggle.checked);
      hideEmptySections();
    });
  }

  const hideAdsToggle = document.getElementById("hideAdsToggle") as HTMLInputElement | null;
  if (hideAdsToggle) {
    hideAdsToggle.checked = isAdBlockEnabled();
    hideAdsToggle.addEventListener("change", () => setAdBlockEnabled(hideAdsToggle.checked));
  }

  renderRules(tempEmbedRules);
}
