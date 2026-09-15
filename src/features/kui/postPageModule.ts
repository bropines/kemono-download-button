import { SELECTORS } from '../../config/selectors';
import { kuiState } from '../../state/kuiState';
import { restructureLayout, processEmbeds } from './embeds';
import { initializeImageGallery } from './imageGallery';
import { initializeVideoGallery, destroyVideoGallery } from './videoGallery';
import { initializeComments, removeCommentsLayout } from './comments';
import { initializePostTranslation, removeTranslateButtons } from './translateButtons';
import { lightboxModule } from './lightbox';
import { GalleryLayoutElement } from '../../types';

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
    initializeComments();
    initializePostTranslation();
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
