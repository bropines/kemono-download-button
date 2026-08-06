import { toggleSettingsModal } from './settingsModal';

const GEAR_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 1rem; height: 1rem; fill: currentColor; margin-right: 0.5rem; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6-3.6z"/></svg>`;
const SLIDERS_SVG = `<svg viewBox="0 0 24 24" class="global-sidebar-entry-item-icon" style="width: 1rem; height: 1rem; fill: currentColor; margin-right: 0.5rem; flex-shrink: 0; display: inline-block; vertical-align: middle;"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`;

/**
 * Injects Downloader Settings and UI Settings links into both
 * the Global Sidebar (.global-sidebar) as a NEW dedicated section and the Top Header (.header).
 * Ensures 100% native visual identity, button spacing, line-height, and element hierarchy.
 * Fully resilient against HTMX SPA DOM swaps and Browser Back/Forward navigation.
 */
export function setupNavigationSettings(): void {
  const sidebar = document.querySelector('.global-sidebar');

  // Clean up any stray header buttons or misplaced sidebar items from account section
  if (sidebar) {
    sidebar.querySelectorAll('#kdl-settings-btn-header, #kui-settings-btn-header').forEach((el) => el.remove());
    sidebar.querySelectorAll('.global-sidebar-entry.account #kdl-settings-btn-sidebar, .global-sidebar-entry.account #kui-settings-btn-sidebar').forEach((el) => el.remove());
  }

  // 1. Sidebar Injection (.global-sidebar) - NEW DEDICATED SECTION
  if (sidebar) {
    let settingsGroup = sidebar.querySelector('.kdl-settings-sidebar-entry');
    if (!settingsGroup || !sidebar.contains(settingsGroup)) {
      if (settingsGroup) settingsGroup.remove();
      settingsGroup = document.createElement('div');
      settingsGroup.className = 'global-sidebar-entry kdl-settings-sidebar-entry';

      // Insert section header title "Settings"
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'global-sidebar-entry-item header';
      sectionHeader.innerHTML = `${GEAR_SVG} Settings`;
      settingsGroup.appendChild(sectionHeader);

      const stuckBottom = sidebar.querySelector('.global-sidebar-entry.stuck-bottom');
      if (stuckBottom) {
        stuckBottom.parentNode?.insertBefore(settingsGroup, stuckBottom);
      } else {
        sidebar.appendChild(settingsGroup);
      }
    }

    const existingKdlSidebar = document.getElementById('kdl-settings-btn-sidebar');
    if (!existingKdlSidebar || !settingsGroup.contains(existingKdlSidebar)) {
      if (existingKdlSidebar) existingKdlSidebar.remove();
      const kdlLink = document.createElement('a');
      kdlLink.id = 'kdl-settings-btn-sidebar';
      kdlLink.className = 'global-sidebar-entry-item';
      kdlLink.href = '#';
      kdlLink.title = 'Downloader Settings';
      kdlLink.innerHTML = `${GEAR_SVG} Downloader`;
      kdlLink.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        toggleSettingsModal(true);
      });
      settingsGroup.appendChild(kdlLink);
    }

    const existingKuiSidebar = document.getElementById('kui-settings-btn-sidebar');
    if (!existingKuiSidebar || !settingsGroup.contains(existingKuiSidebar)) {
      if (existingKuiSidebar) existingKuiSidebar.remove();
      const kuiLink = document.createElement('a');
      kuiLink.id = 'kui-settings-btn-sidebar';
      kuiLink.className = 'global-sidebar-entry-item';
      kuiLink.href = '#';
      kuiLink.title = 'UI Settings';
      kuiLink.innerHTML = `${SLIDERS_SVG} UI Settings`;
      kuiLink.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        const settingsPanel = document.getElementById('kui-settings-panel');
        if (settingsPanel) settingsPanel.classList.toggle('kui-panel-active');
      });
      settingsGroup.appendChild(kuiLink);
    }
  }

  // 2. Top Header Injection (div.header or div.header.sidebar-retracted)
  const topHeader = Array.from(document.querySelectorAll<HTMLElement>('.header')).find(
    (el) => !el.closest('.global-sidebar') && !el.classList.contains('global-sidebar-entry-item')
  );

  if (topHeader) {
    const insertTarget =
      topHeader.querySelector('a.logout') ||
      topHeader.querySelector('a.login') ||
      topHeader.querySelector('a.register') ||
      topHeader.querySelector('a.account') ||
      topHeader.querySelector('a.logged-in-only') ||
      topHeader.querySelector('a.logged-out-only') ||
      topHeader.querySelector('a.header-link:last-of-type');

    const existingKdlHeader = topHeader.querySelector('#kdl-settings-btn-header');
    if (!existingKdlHeader || !topHeader.contains(existingKdlHeader)) {
      if (existingKdlHeader) existingKdlHeader.remove();
      const kdlHeaderBtn = document.createElement('a');
      kdlHeaderBtn.id = 'kdl-settings-btn-header';
      kdlHeaderBtn.className = 'header-link kdl-settings-header-link';
      kdlHeaderBtn.href = '#';
      kdlHeaderBtn.title = 'Downloader Settings';
      kdlHeaderBtn.textContent = 'Downloader';
      kdlHeaderBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        toggleSettingsModal(true);
      });

      if (insertTarget) {
        topHeader.insertBefore(kdlHeaderBtn, insertTarget);
      } else {
        topHeader.appendChild(kdlHeaderBtn);
      }
    }

    const existingKuiHeader = topHeader.querySelector('#kui-settings-btn-header');
    if (!existingKuiHeader || !topHeader.contains(existingKuiHeader)) {
      if (existingKuiHeader) existingKuiHeader.remove();
      const kuiHeaderBtn = document.createElement('a');
      kuiHeaderBtn.id = 'kui-settings-btn-header';
      kuiHeaderBtn.className = 'header-link kui-settings-header-link';
      kuiHeaderBtn.href = '#';
      kuiHeaderBtn.title = 'UI Settings';
      kuiHeaderBtn.textContent = 'UI Settings';
      kuiHeaderBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        const settingsPanel = document.getElementById('kui-settings-panel');
        if (settingsPanel) settingsPanel.classList.toggle('kui-panel-active');
      });

      if (insertTarget) {
        topHeader.insertBefore(kuiHeaderBtn, insertTarget);
      } else {
        topHeader.appendChild(kuiHeaderBtn);
      }
    }
  }
}
