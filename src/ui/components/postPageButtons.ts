import { getPostDetailsFromPage } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { executeLinkAction } from '../../services/linkService';
import { addTaskToQueue } from '../../services/queueService';
import { executeTranslation } from '../../services/translationService';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';

export async function createAndInsertPostPageButtons(container: HTMLElement, referenceElement?: Element | null): Promise<void> {
  await getSettings();
  document.querySelectorAll('.kdl-button').forEach((node) => node.remove());
  const postDetails = getPostDetailsFromPage();
  const fragment = document.createDocumentFragment();

  const createButton = (
    text: string,
    title: string,
    bgColor: string,
    onClick: (e: MouseEvent) => void,
    onContext?: (e: MouseEvent) => void
  ) => {
    return el(
      'button',
      {
        className: 'kdl-button',
        title,
        style: {
          padding: '8px 12px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9em',
          color: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          backgroundColor: bgColor
        },
        onClick,
        onContextMenu: onContext
      },
      [text]
    );
  };

  if (
    state.settings.showTranslateButton &&
    state.settings.translationProvider !== 'none' &&
    (state.settings.geminiApiKey || state.settings.deeplApiKey)
  ) {
    fragment.appendChild(createButton('Translate 📝', 'Translate', '#5856d6', (e) => executeTranslation(e.target as HTMLElement)));
  }

  if (state.settings.showCopyLinksButton) {
    const btn = createButton(
      'Copy Links',
      'Left-click: Copy for aria2c/IDM. Right-click: Get .txt for ADM.',
      '#17a2b8',
      (e) => executeLinkAction('copy-aria', postDetails, e.target as HTMLElement, 'Copy Links'),
      (e) => {
        e.preventDefault();
        executeLinkAction('download-txt', postDetails, e.target as HTMLElement, 'Copy Links');
      }
    );
    fragment.appendChild(btn);
  }

  if (state.settings.showShareButton && typeof navigator.share === 'function') {
    fragment.appendChild(
      createButton('Share Links', 'Share Links', '#6f42c1', (e) =>
        executeLinkAction('share', postDetails, e.target as HTMLElement, 'Share Links')
      )
    );
  }

  if (state.settings.showImagesButton) {
    fragment.appendChild(
      createButton('Download Images', 'Download Images', '#007bff', (e) =>
        addTaskToQueue('Images', (pd) => executeIndividualDownload('Images', pd), postDetails, e.target as HTMLElement, 'Download Images')
      )
    );
  }

  if (state.settings.showFilesButton) {
    const btn = createButton('Download Attachments', 'Download Attachments', '#ffc107', (e) =>
      addTaskToQueue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), postDetails, e.target as HTMLElement, 'Download Attachments')
    );
    btn.style.color = '#212529';
    fragment.appendChild(btn);
  }

  if (state.settings.showZipButton) {
    fragment.appendChild(
      createButton('Download (ZIP)', 'Download (ZIP)', '#28a745', (e) =>
        addTaskToQueue('ZIP', executeZipDownload, postDetails, e.target as HTMLElement, 'Download (ZIP)')
      )
    );
  }

  container.insertBefore(fragment, referenceElement ? referenceElement.nextSibling : container.firstChild);
}
