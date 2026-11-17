import { getApiAdapter } from '../../api';
import { fetchCreatorName } from '../../api/kemonoApi';
import type { IconName } from '../../config/icons';
import { getPostCardDetails } from '../../services/collectorService';
import { executeIndividualDownload, executeZipDownload } from '../../services/downloadService';
import { addTaskToQueue } from '../../services/queueService';
import { appState, getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { button, ensureKit, kitScope, popover, tooltip, type ButtonVariant } from '../kit';
import { showFilePickerModal } from './filePickerModal';

// Post info, fetched once per card and kept on it
async function loadPostInfo(postCardNode: HTMLElement, details: ReturnType<typeof getPostCardDetails>): Promise<string> {
  if (postCardNode.dataset.postInfo) return postCardNode.dataset.postInfo;
  const apiResponse = await getApiAdapter().fetchPostData(details.service, details.userID, details.postID);
  const post = apiResponse?.post || (Array.isArray(apiResponse) ? apiResponse[0] : apiResponse);
  if (!post) throw new Error('No post data');
  const fileCount = post.file ? 1 : 0;
  const attachmentCount = post.attachments ? post.attachments.length : 0;
  const totalFiles = fileCount + attachmentCount;
  const infoText = `Title: ${post.title}\nPublished: ${new Date(post.published).toLocaleDateString()}\nTotal Files: ${totalFiles} (${attachmentCount} attachments, ${fileCount} main file)`;
  postCardNode.dataset.postInfo = infoText;
  return infoText;
}

// List cards (posts, popular, search) carry no creator name: look it up when a download starts
async function withAuthorName(details: ReturnType<typeof getPostCardDetails>): Promise<typeof details> {
  if (details.authorName) return details;
  details.authorName = (await fetchCreatorName(details.service, details.userID)) || 'UnknownAuthor';
  return details;
}

/** `pageAuthorName` null: a list card, the name is fetched on the first download */
export async function injectPostCardButtons(postCardNode: HTMLElement, pageAuthorName: string | null): Promise<void> {
  // Claim the card before the first await: overlapping inits used to both pass the check and stack tooltips
  if (postCardNode.dataset.kdlCardButtons) return;
  postCardNode.dataset.kdlCardButtons = 'true';
  await getSettings();
  // Leftovers from an htmx history snapshot have no listeners: rebuild them
  postCardNode.querySelectorAll(':scope > .post-card-download-controls, :scope > .kdl-post-info-tooltip').forEach((node) => node.remove());
  const details = getPostCardDetails(postCardNode, pageAuthorName || '');
  if (details.postID === 'UnknownPostID') return;
  ensureKit();
  const queue = (label: string, run: Parameters<typeof addTaskToQueue>[1], btn: HTMLElement, short: string) =>
    void withAuthorName(details).then((ready) => addTaskToQueue(label, run, ready, btn, short));

  const controlsContainer = kitScope([], { className: 'post-card-download-controls' });

  const createMiniBtn = (iconName: IconName, title: string, cls: string, variant: ButtonVariant, onClick?: (btn: HTMLElement) => void) => {
    const btn = button({
      icon: iconName,
      variant,
      size: 'icon',
      ariaLabel: title,
      className: cls,
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // currentTarget: with icon buttons the event target can be an inner <svg>/<path>
        onClick?.(e.currentTarget as HTMLElement);
      },
    });
    controlsContainer.appendChild(tooltip(btn, { text: title, side: 'left' }));
    return btn;
  };

  if (state.settings.showZipButton) createMiniBtn('package', 'Download ZIP', 'post-card-dl-zip', 'default', (btn) => queue('ZIP', executeZipDownload, btn, 'ZIP'));
  if (state.settings.showImagesButton) createMiniBtn('images', 'Download Images', 'post-card-dl-img', 'secondary', (btn) => queue('Images', (pd) => executeIndividualDownload('Images', pd), btn, 'Imgs'));
  if (state.settings.showFilesButton) {
    createMiniBtn('paperclip', 'Download Attachments', 'post-card-dl-att', 'secondary', (btn) => queue('Attachments', (pd) => executeIndividualDownload('Attachments', pd), btn, 'Attach.'));
    createMiniBtn('folder-open', 'Pick & Download Attachment', 'post-card-dl-pick', 'secondary', () => void withAuthorName(details).then(showFilePickerModal));
  }

  if (controlsContainer.hasChildNodes()) {
    // Rendered in the kit's shadow root, where page styles don't reach: the one rule it needs is inline
    const infoBody = el('div', { className: 'kdl-post-info-tooltip', style: { whiteSpace: 'pre-line', fontSize: '13px' } });
    const infoBtn = createMiniBtn('info', 'Show post info', 'post-card-dl-info', 'ghost');
    // Toggles on click; filled when it opens, from the card's cache after the first time
    popover({
      trigger: infoBtn,
      content: infoBody,
      ariaLabel: 'Post info',
      side: 'left',
      align: 'start',
      onOpenChange: async (open) => {
        if (!open) return;
        if (!postCardNode.dataset.postInfo) infoBody.replaceChildren(el('em', {}, ['Loading...']));
        try {
          infoBody.textContent = await loadPostInfo(postCardNode, details);
        } catch (err) {
          infoBody.replaceChildren(el('em', {}, ['Failed to load info.']));
        }
      },
    });
    postCardNode.appendChild(controlsContainer);
  }
}

// Self-scoped kit icon button: it sits straight in the site's card, with no .kdl-scope around it
function favoriteButton(): HTMLButtonElement {
  ensureKit();
  return tooltip(
    button({ icon: 'star', variant: 'secondary', size: 'icon', ariaLabel: 'Toggle Favorite', className: 'kdl-scope kdl-quick-fav-btn' }),
    { text: 'Toggle Favorite', side: 'left' }
  );
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
  // Current artist cards carry no data attributes, only href="/{service}/user/{id}"
  const hrefMatch = cardNode.getAttribute('href')?.match(/^\/([^/]+)\/user\/([^/?#]+)/);
  const service = cardNode.dataset.service || hrefMatch?.[1];
  const creatorId = cardNode.dataset.id || hrefMatch?.[2];
  if (!service || !creatorId) return;

  const isFavorited = appState.favoritedArtists.has(`${service}-${creatorId}`);
  const favBtn = favoriteButton();
  cardNode.appendChild(favBtn);

  updateCardFavoriteState(cardNode, isFavorited, 'creator');

  favBtn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getApiAdapter().toggleFavorite(favBtn, 'creator', service, creatorId, null, updateCardFavoriteState);
  });
}

export function injectPostFavoriteButton(cardNode: HTMLElement): void {
  if (cardNode.querySelector('.kdl-quick-fav-btn')) return;
  const service = cardNode.dataset.service;
  const creatorId = cardNode.dataset.user;
  const postId = cardNode.dataset.id;
  if (!service || !creatorId || !postId) return;

  const isFavorited = appState.favoritedPosts.has(postId);
  const favBtn = favoriteButton();
  cardNode.appendChild(favBtn);

  updateCardFavoriteState(cardNode, isFavorited, 'post');

  favBtn.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getApiAdapter().toggleFavorite(favBtn, 'post', service, creatorId, postId, updateCardFavoriteState);
  });
}
