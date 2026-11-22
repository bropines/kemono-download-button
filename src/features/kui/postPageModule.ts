import { SELECTORS } from '../../config/selectors';
import { kuiState } from '../../state/kuiState';
import { restructureLayout, processEmbeds } from './embeds';
import { initializeImageGallery } from './imageGallery';
import { initializeVideoGallery, destroyVideoGallery } from './videoGallery';
import { initializeComments, removeCommentsLayout } from './comments';
import { initializePostTranslation, removeTranslateButtons } from './translateButtons';
import { lightboxModule } from './lightbox';
import { GalleryLayoutElement } from '../../types';
import { hideEmptySections, restoreAttachmentButtons } from './embeds';
import type { KdlModule, SettingDef } from '../../core/types';
import { getModuleSetting } from '../../core/registry';

// Post blocks the user can switch off. Hidden with CSS from an attribute on <html> (set at document start too,
// so a hidden block never flashes); each block matches both the site's markup and the gallery's wrapped one.
const BLOCKS: { key: string; label: string; match: string }[] = [
  { key: 'downloads', label: 'Downloads (attachments)', match: '.post__attachments' },
  { key: 'content', label: 'Text content', match: '.post__content' },
  { key: 'files', label: 'Files and image gallery', match: '.post__files, .kui-gallery-layout' },
  { key: 'videos', label: 'Videos', match: '.kui-video-gallery-layout, .post__video, .post__videos, .kui-video-section' },
  { key: 'comments', label: 'Comments', match: 'footer.post__footer' },
  { key: 'tags', label: 'Tags', match: '#post-tags' },
];
const HIDE_ATTR = 'data-kdl-post-hide';
const blockKey = (key: string): string => 'hide' + key[0].toUpperCase() + key.slice(1);
function syncHiddenBlocks(get: (key: string) => unknown): void {
  const hidden = BLOCKS.filter((block) => get(blockKey(block.key)) === true).map((block) => block.key).join(' ');
  if (hidden) document.documentElement.setAttribute(HIDE_ATTR, hidden);
  else document.documentElement.removeAttribute(HIDE_ATTR);
}
const blockStyles = (): string =>
  BLOCKS.map(({ key, match }) => {
    // Layout edit mode shows hidden blocks whole, so they can be told apart and switched back on
    const scope = `html[${HIDE_ATTR}~="${key}"]:not([data-kdl-layout-edit])`;
    const inner = match.split(',').map((m) => m.trim());
    return [
      ...inner.map((m) => `${scope} .kui-post-section:has(${m})`),
      ...inner.map((m) => `${scope} ${m}`),
      ...inner.map((m) => `${scope} .post__body > h2:has(+ ${m})`),
    ].join(', ') + ' { display: none !important; }';
  }).join(' ');
const blockSettings: SettingDef[] = BLOCKS.map(({ key, label }) => ({ key: blockKey(key), label: `Hide: ${label}`, type: 'boolean', default: false }));

export const postPageModule = {
  originalContentHTML: null as string | null,
  init() {
    document.removeEventListener("keydown", this.handleGlobalKeys, true);

    const content = document.querySelector(SELECTORS.postContent);
    if (content) {
      this.originalContentHTML = content.innerHTML;
    }
    restructureLayout(processEmbeds);
    initializeImageGallery();
    initializeVideoGallery();
    document.addEventListener("keydown", this.handleGlobalKeys, true);
    kuiState.isPostPageModuleActive = true;
  },
  cleanup() {
    document.removeEventListener("keydown", this.handleGlobalKeys, true);
    destroyVideoGallery();
    // An open lightbox would otherwise keep the next page scroll-locked and its arrow keys captured
    lightboxModule.close();
    // Translations first: they are restored through buttons that live inside the comments
    removeTranslateButtons();
    removeCommentsLayout();
    restoreAttachmentButtons();

    document.querySelectorAll(".kui-gallery-layout, .kui-video-gallery-layout, .kui-embed-container, .kui-thumb-wrapper, .kui-gallery-preview").forEach((el) => el.remove());

    document.querySelectorAll(".kui-post-section").forEach((section) => {
      const parent = section.parentNode;
      if (parent) {
        while (section.firstChild) {
          parent.insertBefore(section.firstChild, section);
        }
        section.remove();
      }
    });

    const originalFilesContainer = document.querySelector<HTMLElement>(SELECTORS.postFilesContainer);
    if (originalFilesContainer) {
      originalFilesContainer.style.removeProperty("display");
    }

    document.querySelectorAll(".kui-hidden-original").forEach((el) => {
      el.classList.remove("kui-hidden-original");
      (el as HTMLElement).style.removeProperty("display");
    });

    const processedElements = document.querySelectorAll(".kui-processed, .kui-gallery-processed, .kui-video-gallery-processed, .kui-embed-processed");
    processedElements.forEach((el) => {
      el.classList.remove("kui-processed", "kui-gallery-processed", "kui-video-gallery-processed", "kui-embed-processed");
      if ((el as HTMLElement).style.display === "none") {
        (el as HTMLElement).style.display = "";
      }
    });

    this.originalContentHTML = null;
    kuiState.isPostPageModuleActive = false;
  },
  refreshContent() {
    const content = document.querySelector(SELECTORS.postContent);
    if (content && this.originalContentHTML) {
      content.innerHTML = this.originalContentHTML;
      const oldEmbedContainer = content.querySelector(".kui-embed-container");
      if (oldEmbedContainer) oldEmbedContainer.remove();
      content.classList.remove("kui-embed-processed");
      processEmbeds();
      initializeImageGallery();
    }
  },
  handleGlobalKeys(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (lightboxModule.isActive || (target && ["INPUT", "TEXTAREA"].includes(target.tagName))) {
      return;
    }
    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest(".plyr")) {
      return;
    }
    const gallery = document.querySelector<GalleryLayoutElement>(".kui-gallery-layout");
    if (gallery && typeof gallery.navigate === "function") {
      let direction = 0;
      if (e.key === "ArrowLeft") direction = -1;
      if (e.key === "ArrowRight") direction = 1;
      if (direction !== 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        gallery.navigate(direction);
      }
    }
  }
};

// Init when the post body is new (or our layout was wiped), tear down when it is gone. Comments render late
// on the kemono SPA and get re-rendered by the site, and translate buttons follow settings that load later
function syncPostPage(): void {
  const postBody = document.querySelector(SELECTORS.postBody);
  const isOnPostPage = !!document.querySelector(SELECTORS.postPageContainer);
  if (isOnPostPage && postBody) {
    if (!postBody.classList.contains("kui-processed") || !kuiState.isPostPageModuleActive) postPageModule.init();
    initializeComments();
    initializePostTranslation();
    hideEmptySections();
  } else if (kuiState.isPostPageModuleActive) {
    postPageModule.cleanup();
  }
}

export const kuiPostModule: KdlModule = {
  id: 'kui.post',
  name: 'Post page layout',
  description: 'Image gallery, video player, embeds, comments layout and translation on post pages.',
  group: 'Post page',
  pages: ['post'],
  defaultEnabled: true,
  // kuiState reads and writes these keys; the listeners keep it in step with a settings UI
  settings: [
    { key: 'preloadImages', label: 'Preload gallery images', type: 'boolean', default: false, hint: 'Loads every post image in the background when the gallery opens.' },
    { key: 'hideEmptySections', label: 'Hide empty post sections', type: 'boolean', default: true },
    ...blockSettings,
  ],
  styles: blockStyles,
  setup(ctx) {
    BLOCKS.forEach(({ key }) => ctx.settings.onChange(blockKey(key), () => syncHiddenBlocks((k) => ctx.settings.get(k))));
    ctx.settings.onChange('preloadImages', (value) => {
      kuiState.isPreloadEnabled = Boolean(value);
    });
    ctx.settings.onChange('hideEmptySections', (value) => {
      kuiState.isHideEmptySectionsEnabled = Boolean(value);
      hideEmptySections();
    });
  },
  mount(ctx) {
    syncHiddenBlocks((k) => ctx.settings.get(k));
    ctx.onCleanup(() => document.documentElement.removeAttribute(HIDE_ATTR));
    syncPostPage();
  },
  early() {
    syncHiddenBlocks((k) => getModuleSetting('kui.post', k));
  },
  update: syncPostPage,
  unmount: () => postPageModule.cleanup(),
  // Snapshots must not carry the gallery/player: they come back without listeners
  beforeSnapshot: () => postPageModule.cleanup()
};
