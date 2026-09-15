import { getPostDetailsFromPage } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { executeLinkAction } from '../../services/linkService';
import { addTaskToQueue } from '../../services/queueService';
import { executeTranslation } from '../../services/translationService';
import { isTranslationConfigured } from '../../services/translators';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';

export async function createAndInsertPostPageButtons(container: HTMLElement, referenceElement?: Element | null): Promise<void> {
  await getSettings();
  document.querySelectorAll('.kdl-actions-container, .kdl-button').forEach((node) => node.remove());
  const postDetails = getPostDetailsFromPage();

  const createButton = (
    text: string,
    title: string,
    bgGradient: string,
    onClick: (e: MouseEvent) => void,
    onContext?: (e: MouseEvent) => void
  ) => {
    return el(
      'button',
      {
        className: 'kdl-button',
        title,
        // Everything else comes from .kdl-button (postActions.styles.ts), which overrides inline styles anyway
        style: { background: bgGradient },
        onClick,
        onContextMenu: onContext
      },
      [text]
    );
  };

  const toolsCol = el('div', { className: 'kdl-actions-col kdl-actions-tools' });
  const downloadsCol = el('div', { className: 'kdl-actions-col kdl-actions-downloads' });

  // Column 1: Links & Utilities
  if (state.settings.showCopyLinksButton) {
    toolsCol.appendChild(
      createButton(
        '📋 Copy Links',
        'Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.',
        'linear-gradient(135deg, #06b6d4, #0891b2)',
        (e) => executeLinkAction('copy-aria', postDetails, e.target as HTMLElement, '📋 Copy Links'),
        (e) => {
          e.preventDefault();
          executeLinkAction('download-txt', postDetails, e.target as HTMLElement, '📋 Copy Links');
        }
      )
    );
  }

  if (state.settings.showShareButton && typeof navigator.share === 'function') {
    toolsCol.appendChild(
      createButton('🔗 Share Links', 'Share Links', 'linear-gradient(135deg, #8b5cf6, #7c3aed)', (e) =>
        executeLinkAction('share', postDetails, e.target as HTMLElement, '🔗 Share Links')
      )
    );
  }

  if (state.settings.showTranslateButton && isTranslationConfigured(state.settings)) {
    toolsCol.appendChild(createButton('📝 Translate', 'Translate', 'linear-gradient(135deg, #6366f1, #4f46e5)', (e) => executeTranslation(e.target as HTMLElement)));
  }

  // Column 2: Download Actions
  if (state.settings.showImagesButton) {
    downloadsCol.appendChild(
      createButton('🖼️ Download Images', 'Download Images', 'linear-gradient(135deg, #3b82f6, #1d4ed8)', (e) =>
        addTaskToQueue('Images', (pd) => executeIndividualDownload('Images', pd), postDetails, e.target as HTMLElement, '🖼️ Download Images')
      )
    );
  }

  if (state.settings.showFilesButton) {
    downloadsCol.appendChild(
      createButton('📎 Download Attachments', 'Download Attachments', 'linear-gradient(135deg, #f59e0b, #d97706)', (e) =>
        addTaskToQueue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), postDetails, e.target as HTMLElement, '📎 Download Attachments')
      )
    );
  }

  if (state.settings.showZipButton) {
    downloadsCol.appendChild(
      createButton('📦 Download (ZIP)', 'Download (ZIP)', 'linear-gradient(135deg, #10b981, #047857)', (e) =>
        addTaskToQueue('ZIP', executeZipDownload, postDetails, e.target as HTMLElement, '📦 Download (ZIP)')
      )
    );
  }

  const kdlContainer = el('div', { className: 'kdl-actions-container' }, [toolsCol, downloadsCol]);
  container.appendChild(kdlContainer);
}
