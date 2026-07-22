import { fetchPostDataFromAPI, toggleFavorite } from '../../api/kemonoApi';
import { getPostCardDetails } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { addTaskToQueue } from '../../services/queueService';
import { appState, getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { showFilePickerModal } from './filePickerModal';

export async function injectPostCardButtons(postCardNode: HTMLElement, pageAuthorName: string): Promise<void> {
  await getSettings();
  if (postCardNode.querySelector('.post-card-download-controls')) return;
  const details = getPostCardDetails(postCardNode, pageAuthorName);
  if (details.postID === 'UnknownPostID') return;

  const controlsContainer = el('div', { className: 'post-card-download-controls' });

  const createMiniBtn = (text: string, title: string, cls: string, onClick: (btn: HTMLElement) => void) => {
    controlsContainer.appendChild(
      el(
        'button',
        {
          className: cls,
          title,
          onClick: (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(e.target as HTMLElement);
          }
        },
        [text]
      )
    );
  };

  if (state.settings.showZipButton) createMiniBtn('ZIP', 'Download ZIP', 'post-card-dl-zip', (btn) => addTaskToQueue('ZIP', executeZipDownload, details, btn, 'ZIP'));
  if (state.settings.showImagesButton) createMiniBtn('Imgs', 'Download Images', 'post-card-dl-img', (btn) => addTaskToQueue('Images', (pd) => executeIndividualDownload('Images', pd), details, btn, 'Imgs'));
  if (state.settings.showFilesButton) {
    createMiniBtn('Attach.', 'Download Attachments', 'post-card-dl-att', (btn) => addTaskToQueue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), details, btn, 'Attach.'));
    createMiniBtn('📎', 'Pick & Download Attachment', 'post-card-dl-pick', () => showFilePickerModal(details));
  }

  if (controlsContainer.hasChildNodes()) {
    const tooltip = el('div', { className: 'kdl-post-info-tooltip' });
    postCardNode.appendChild(tooltip);
    let isFetching = false;
    const infoBtn = el('button', { className: 'post-card-dl-info', title: 'Show post info' }, ['ℹ️']);

    infoBtn.addEventListener('mouseover', async () => {
      tooltip.style.display = 'block';
      if (postCardNode.dataset.postInfo) {
        tooltip.innerHTML = postCardNode.dataset.postInfo;
        return;
      }
      if (isFetching) return;
      isFetching = true;
      tooltip.innerHTML = '<em>Loading...</em>';
      try {
        const apiResponse = await fetchPostDataFromAPI(details.service, details.userID, details.postID);
        const post = apiResponse?.post || (Array.isArray(apiResponse) ? apiResponse[0] : apiResponse);
        if (!post) throw new Error('No post data');
        const fileCount = post.file ? 1 : 0;
        const attachmentCount = post.attachments ? post.attachments.length : 0;
        const totalFiles = fileCount + attachmentCount;
        const infoHTML = `<b>Title:</b> ${post.title}<br><b>Published:</b> ${new Date(post.published).toLocaleDateString()}<br><b>Total Files:</b> ${totalFiles}<br><em>(${attachmentCount} attachments, ${fileCount} main file)</em>`;
        tooltip.innerHTML = infoHTML;
        postCardNode.dataset.postInfo = infoHTML;
      } catch (err) {
        tooltip.innerHTML = '<em>Failed to load info.</em>';
      } finally {
        isFetching = false;
      }
    });

    infoBtn.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });

    controlsContainer.appendChild(infoBtn);
    postCardNode.appendChild(controlsContainer);
  }
}

export function updateCardFavoriteState(card: HTMLElement | null, isFavorited: boolean, type: string): void {
  if (!card) return;
  const favBtn = card.querySelector('.kdl-quick-fav-btn');
  if (isFavorited) {
    if (favBtn) favBtn.classList.add('kdl-favorited');
    if (type === 'creator') card.classList.add('user-card--fav');
    else {
      card.querySelector('.post-card__header')?.classList.add('post-card__header--fav');
      card.querySelector('.post-card__footer')?.classList.add('post-card__footer--fav');
    }
  } else {
    if (favBtn) favBtn.classList.remove('kdl-favorited');
    if (type === 'creator') card.classList.remove('user-card--fav');
    else {
      card.querySelector('.post-card__header')?.classList.remove('post-card__header--fav');
      card.querySelector('.post-card__footer')?.classList.remove('post-card__footer--fav');
    }
  }
}

export function injectArtistFavoriteButton(cardNode: HTMLElement): void {
  if (cardNode.querySelector('.kdl-quick-fav-btn')) return;
  const service = cardNode.dataset.service;
  const creatorId = cardNode.dataset.id;
  if (!service || !creatorId) return;

  const isFavorited = appState.favoritedArtists.has(`${service}-${creatorId}`);
  const favBtn = document.createElement('button');
  favBtn.className = 'kdl-quick-fav-btn';
  favBtn.innerHTML = '⭐';
  favBtn.title = 'Toggle Favorite';
  cardNode.appendChild(favBtn);

  updateCardFavoriteState(cardNode, isFavorited, 'creator');

  favBtn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(favBtn, 'creator', service, creatorId, null, updateCardFavoriteState);
  });
}

export function injectPostFavoriteButton(cardNode: HTMLElement): void {
  if (cardNode.querySelector('.kdl-quick-fav-btn')) return;
  const service = cardNode.dataset.service;
  const creatorId = cardNode.dataset.user;
  const postId = cardNode.dataset.id;
  if (!service || !creatorId || !postId) return;

  const isFavorited = appState.favoritedPosts.has(postId);
  const favBtn = document.createElement('button');
  favBtn.className = 'kdl-quick-fav-btn';
  favBtn.innerHTML = '⭐';
  favBtn.title = 'Toggle Favorite';
  cardNode.appendChild(favBtn);

  updateCardFavoriteState(cardNode, isFavorited, 'post');

  favBtn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(favBtn, 'post', service, creatorId, postId, updateCardFavoriteState);
  });
}
