import { getPostDetailsFromPage } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { executeLinkAction } from '../../services/linkService';
import { addTaskToQueue } from '../../services/queueService';
import type { IconName } from '../../config/icons';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { button, ensureKit, kitScope, tooltip, type ButtonVariant } from '../kit';
import { t } from '../../i18n';

export async function createAndInsertPostPageButtons(container: HTMLElement, referenceElement?: Element | null): Promise<void> {
  await getSettings();
  document.querySelectorAll('.kdl-actions-container, .kdl-button').forEach((node) => node.remove());
  const postDetails = getPostDetailsFromPage();
  ensureKit();

  const createButton = (
    iconName: IconName,
    text: string,
    hint: string,
    variant: ButtonVariant,
    onClick: (e: MouseEvent) => void,
    onContext?: (e: MouseEvent) => void
  ) => {
    // kdl-button stays as a stable hook for user styles; the look is the kit's
    const btn = button({ icon: iconName, label: text, variant, size: 'sm', className: 'kdl-button', onClick });
    if (onContext) btn.addEventListener('contextmenu', onContext);
    return hint === text ? btn : tooltip(btn, { text: hint });
  };

  const toolsCol = el('div', { className: 'kdl-actions-col kdl-actions-tools' });
  const downloadsCol = el('div', { className: 'kdl-actions-col kdl-actions-downloads' });

  // Column 1: Links & Utilities
  if (state.settings.showCopyLinksButton) {
    toolsCol.appendChild(
      createButton(
        'copy',
        t('dl.post.copyLinks'),
        t('dl.post.copyLinks.hint'),
        'outline',
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
      createButton('share-2', t('dl.post.shareLinks'), t('dl.post.shareLinks'), 'outline', (e) =>
        executeLinkAction('share', postDetails, e.currentTarget as HTMLElement, 'Share Links')
      )
    );
  }

  // Column 2: Download Actions
  if (state.settings.showImagesButton) {
    downloadsCol.appendChild(
      createButton('images', t('dl.post.downloadImages'), t('dl.post.downloadImages'), 'secondary', (e) =>
        addTaskToQueue('Images', (pd) => executeIndividualDownload('Images', pd), postDetails, e.currentTarget as HTMLElement, 'Download Images')
      )
    );
  }

  if (state.settings.showFilesButton) {
    downloadsCol.appendChild(
      createButton('paperclip', t('dl.post.downloadAttachments'), t('dl.post.downloadAttachments'), 'secondary', (e) =>
        addTaskToQueue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), postDetails, e.currentTarget as HTMLElement, 'Download Attachments')
      )
    );
  }

  if (state.settings.showZipButton) {
    downloadsCol.appendChild(
      createButton('package', t('dl.post.downloadZip'), t('dl.post.downloadZip'), 'default', (e) =>
        addTaskToQueue('ZIP', executeZipDownload, postDetails, e.currentTarget as HTMLElement, 'Download (ZIP)')
      )
    );
  }

  const kdlContainer = kitScope([toolsCol, downloadsCol], { className: 'kdl-actions-container' });
  kdlContainer.setAttribute('role', 'group');
  kdlContainer.setAttribute('aria-label', t('dl.post.groupLabel'));
  container.appendChild(kdlContainer);
}
