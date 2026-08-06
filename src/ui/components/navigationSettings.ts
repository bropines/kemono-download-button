import { SELECTORS } from '../../config/selectors';
import { toggleSettingsModal } from './settingsModal';

/**
 * Injects Downloader Settings and UI Settings links into both
 * the Global Sidebar (.global-sidebar) and the Top Header (.header).
 * Ensures buttons are accessible whether the sidebar is expanded or retracted.
 */
export function setupNavigationSettings(): void {
  // 1. Sidebar Injection (.global-sidebar)
  const sidebar = document.querySelector('.global-sidebar');
  if (sidebar) {
    const stuckBottom = sidebar.querySelector(SELECTORS.sidebarCommunitySection) || sidebar.querySelector('.global-sidebar-entry.account');

    if (!document.getElementById('kdl-settings-btn-sidebar')) {
      const kdlEntry = document.createElement('div');
      kdlEntry.className = 'global-sidebar-entry';
      kdlEntry.innerHTML = `<a id="kdl-settings-btn-sidebar" class="global-sidebar-entry-item" href="#">Downloader Settings</a>`;

      if (stuckBottom) {
        stuckBottom.parentNode?.insertBefore(kdlEntry, stuckBottom);
      } else {
        sidebar.appendChild(kdlEntry);
      }

      document.getElementById('kdl-settings-btn-sidebar')?.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        toggleSettingsModal(true);
      });
    }

    if (!document.getElementById('kui-settings-btn-sidebar')) {
      const kuiEntry = document.createElement('div');
      kuiEntry.className = 'global-sidebar-entry';
      kuiEntry.innerHTML = `<a id="kui-settings-btn-sidebar" class="global-sidebar-entry-item" href="#">UI Settings</a>`;

      if (stuckBottom) {
        stuckBottom.parentNode?.insertBefore(kuiEntry, stuckBottom);
      } else {
        sidebar.appendChild(kuiEntry);
      }

      document.getElementById('kui-settings-btn-sidebar')?.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        const settingsPanel = document.getElementById('kui-settings-panel');
        if (settingsPanel) settingsPanel.classList.toggle('kui-panel-active');
      });
    }
  }

  // 2. Top Header Injection (.header / .header.sidebar-retracted)
  const header = document.querySelector('.header');
  if (header) {
    const logoutBtn = header.querySelector('a.logout') || header.querySelector('a.login') || header.querySelector('a.logged-in-only');

    if (!document.getElementById('kdl-settings-btn-header')) {
      const kdlHeaderBtn = document.createElement('a');
      kdlHeaderBtn.id = 'kdl-settings-btn-header';
      kdlHeaderBtn.className = 'header-link kdl-settings-header-link';
      kdlHeaderBtn.href = '#';
      kdlHeaderBtn.textContent = 'Downloader';
      kdlHeaderBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        toggleSettingsModal(true);
      });

      if (logoutBtn) {
        header.insertBefore(kdlHeaderBtn, logoutBtn);
      } else {
        header.appendChild(kdlHeaderBtn);
      }
    }

    if (!document.getElementById('kui-settings-btn-header')) {
      const kuiHeaderBtn = document.createElement('a');
      kuiHeaderBtn.id = 'kui-settings-btn-header';
      kuiHeaderBtn.className = 'header-link kui-settings-header-link';
      kuiHeaderBtn.href = '#';
      kuiHeaderBtn.textContent = 'UI Settings';
      kuiHeaderBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        const settingsPanel = document.getElementById('kui-settings-panel');
        if (settingsPanel) settingsPanel.classList.toggle('kui-panel-active');
      });

      if (logoutBtn) {
        header.insertBefore(kuiHeaderBtn, logoutBtn);
      } else {
        header.appendChild(kuiHeaderBtn);
      }
    }
  }
}
