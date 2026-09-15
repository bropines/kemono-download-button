import { getPostDetailsFromPage } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { executeLinkAction } from '../../services/linkService';
import { addTaskToQueue } from '../../services/queueService';
import { icon, IconName } from '../../config/icons';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';

export async function createAndInsertPostPageButtons(container: HTMLElement, referenceElement?: Element | null): Promise<void> {
  await getSettings();
  document.querySelectorAll('.kdl-actions-container, .kdl-button').forEach((node) => node.remove());
  const postDetails = getPostDetailsFromPage();

  const createButton = (
    iconName: IconName,
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
      [icon(iconName), text]
    );
  };

  const toolsCol = el('div', { className: 'kdl-actions-col kdl-actions-tools' });
  const downloadsCol = el('div', { className: 'kdl-actions-col kdl-actions-downloads' });

  // Column 1: Links & Utilities
  if (state.settings.showCopyLinksButton) {
    toolsCol.appendChild(
      createButton(
        'copy',
        'Copy Links',
        'Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.',
        'linear-gradient(135deg, #06b6d4, #0891b2)',
        (e) => executeLinkAction('copy-aria', postDetails, e.currentTarget as HTMLElement, 'Copy Links'),
        (e) => {
          e.preventDefault();
          executeLinkAction('download-txt', postDetails, e.currentTarget as HTMLElement, 'Copy Links');
        }
      )
    );
  }

  if (state.settings.showShareButton && typeof navigator.share === 'function') {
    toolsCol.appendChild(
      createButton('share-2', 'Share Links', 'Share Links', 'linear-gradient(135deg, #8b5cf6, #7c3aed)', (e) =>
        executeLinkAction('share', postDetails, e.currentTarget as HTMLElement, 'Share Links')
      )
    );
  }


  // Column 2: Download Actions
  if (state.settings.showImagesButton) {
    downloadsCol.appendChild(
      createButton('images', 'Download Images', 'Download Images', 'linear-gradient(135deg, #3b82f6, #1d4ed8)', (e) =>
        addTaskToQueue('Images', (pd) => executeIndividualDownload('Images', pd), postDetails, e.currentTarget as HTMLElement, 'Download Images')
      )
    );
  }

  if (state.settings.showFilesButton) {
    downloadsCol.appendChild(
      createButton('paperclip', 'Download Attachments', 'Download Attachments', 'linear-gradient(135deg, #f59e0b, #d97706)', (e) =>
        addTaskToQueue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), postDetails, e.currentTarget as HTMLElement, 'Download Attachments')
      )
    );
  }

  if (state.settings.showZipButton) {
    downloadsCol.appendChild(
      createButton('package', 'Download (ZIP)', 'Download (ZIP)', 'linear-gradient(135deg, #10b981, #047857)', (e) =>
        addTaskToQueue('ZIP', executeZipDownload, postDetails, e.currentTarget as HTMLElement, 'Download (ZIP)')
      )
    );
  }

  const kdlContainer = el('div', { className: 'kdl-actions-container' }, [toolsCol, downloadsCol]);
  container.appendChild(kdlContainer);
}
