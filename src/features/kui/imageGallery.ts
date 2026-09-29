import { SELECTORS } from '../../config/selectors';
import { ICONS, iconSvg } from '../../config/icons';
import { kuiState } from '../../state/kuiState';
import { state } from '../../state/store';
import { translateImage } from '../../services/lensImages';
import { showMessage } from '../../ui/toast';
import { fetchPostFileData } from './api';
import { lightboxModule } from './lightbox';
import { GalleryLayoutElement } from '../../types';
import { sanitizeDuplicates } from '../../utils/domChecker';
import { debugModule } from '../../utils/logger';
import { resolveMediaUrl } from '../../utils/helpers';

// Per container: a slow fetch for the previous post must not block the gallery of the next one
let initializingContainer: Element | null = null;

export async function initializeImageGallery(): Promise<void> {
  const originalFilesContainer = document.querySelector(SELECTORS.postFilesContainer);
  if (!originalFilesContainer || originalFilesContainer.classList.contains("kui-gallery-processed"))
    return;

  if (initializingContainer === originalFilesContainer) {
    debugModule.update({ warn: "[Image Gallery] Initialization already in progress. Skipping concurrent execution." });
    return;
  }

  initializingContainer = originalFilesContainer;
  originalFilesContainer.classList.add("kui-gallery-processed");

  try {
    const imageLinks = Array.from(originalFilesContainer.querySelectorAll<HTMLAnchorElement>("a.fileThumb"));
    if (imageLinks.length === 0) return;

    const fileDataMap = await fetchPostFileData();

    if (!originalFilesContainer.isConnected) {
      debugModule.update({ warn: "[Image Gallery] Container was disconnected during API fetch. Aborting gallery insertion." });
      return;
    }

    const targetSection = originalFilesContainer.closest(".kui-post-section") || originalFilesContainer.parentNode;
    if (!targetSection) return;

    targetSection.querySelectorAll(".kui-gallery-layout").forEach((el) => el.remove());

    const galleryLayout = document.createElement("div") as GalleryLayoutElement;
    galleryLayout.className = "kui-gallery-layout";
    const thumbList = document.createElement("div");
    thumbList.className = "kui-gallery-thumbnails";
    const previewContainer = document.createElement("div");
    previewContainer.className = "kui-gallery-preview";
    const previewImage = document.createElement("img");
    previewImage.className = "kui-gallery-preview-image";
    const thumbToggle = document.createElement("div");
    thumbToggle.className = "kui-gallery-thumb-toggle";
    thumbToggle.addEventListener("click", () => thumbList.classList.toggle("kui-collapsed"));
    previewContainer.appendChild(previewImage);
    previewContainer.appendChild(thumbToggle);

    // Lens renderings, per image index: an image translated once toggles back instantly
    const translatedByIndex = new Map<number, string>();
    let translateBtn: HTMLButtonElement | null = null;
    if (state.settings.showImageTranslateButton) {
      translateBtn = document.createElement("button");
      translateBtn.className = "kui-action-btn";
      translateBtn.title = "Translate the text in this image";
      translateBtn.innerHTML = iconSvg('languages');
      const previewActions = document.createElement("div");
      previewActions.className = "kui-gallery-preview-actions";
      previewActions.appendChild(translateBtn);
      previewContainer.appendChild(previewActions);
    }
    galleryLayout.appendChild(thumbList);
    galleryLayout.appendChild(previewContainer);

    targetSection.appendChild(galleryLayout);
    (originalFilesContainer as HTMLElement).style.display = "none";

    let currentIndex = 0;
    let thumbLinks: HTMLAnchorElement[] = [];

    const setActive = (index: number) => {
      currentIndex = (index + imageLinks.length) % imageLinks.length;
      const activeThumbLink = thumbLinks[currentIndex];
      const originalPageLink = imageLinks[currentIndex];
      if (!activeThumbLink || !originalPageLink) return;
      const imgEl = originalPageLink.querySelector<HTMLImageElement>("img");
      if (!imgEl) return;
      const previewSrc = translatedByIndex.get(currentIndex) || imgEl.src;
      if (previewImage.src !== previewSrc) {
        previewImage.src = previewSrc;
      }
      translateBtn?.classList.toggle("kui-active", translatedByIndex.has(currentIndex));
      thumbLinks.forEach((link) => link.classList.remove("kui-thumb-active"));
      activeThumbLink.classList.add("kui-thumb-active");
      activeThumbLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    galleryLayout.navigate = (direction: number) => setActive(currentIndex + direction);

    translateBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = translateBtn!;
      if (btn.disabled) return;
      // Dropping the rendering shows the original again; translating it back is a cache hit
      if (translatedByIndex.delete(currentIndex)) {
        setActive(currentIndex);
        return;
      }
      const link = imageLinks[currentIndex];
      if (!link) return;
      const index = currentIndex;
      const buttonIcon = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = iconSvg('loader-circle', 'kdl-icon kdl-spin');
      try {
        // The original, not the thumbnail: Lens reads small text badly
        const translated = await translateImage(link.dataset.originalPath || link.href);
        translatedByIndex.set(index, translated);
        if (index === currentIndex) setActive(index);
      } catch (error) {
        showMessage(`Lens: ${(error as Error).message}`, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = buttonIcon;
      }
    });

    let touchStartX = 0;
    previewImage.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    });
    previewImage.addEventListener("touchend", (e) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40 && galleryLayout.navigate)
        galleryLayout.navigate(deltaX < 0 ? 1 : -1);
    });

    thumbLinks = imageLinks.map((thumbLink, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "kui-thumb-wrapper";
      const imgChild = thumbLink.querySelector("img");
      const newThumb = imgChild ? imgChild.cloneNode(true) : document.createElement("img");
      const newThumbLink = document.createElement("a");
      newThumbLink.href = "#";
      newThumbLink.addEventListener("click", (e) => {
        e.preventDefault();
        setActive(index);
      });
      newThumbLink.appendChild(newThumb);
      wrapper.appendChild(newThumbLink);
      const fileName = thumbLink.getAttribute("download");
      if (fileName) {
        const relativePath = fileDataMap.get(fileName);
        if (relativePath) {
          // The file host, not the main domain: pawchive serves /data/ only from file.<domain>
          const fullOriginalPath = resolveMediaUrl(relativePath, fileName);
          thumbLink.dataset.originalPath = fullOriginalPath;
          const actionsContainer = document.createElement("div");
          actionsContainer.className = "kui-thumb-actions";
          const originalLinkBtn = document.createElement("a");
          originalLinkBtn.className = "kui-action-btn";
          originalLinkBtn.href = fullOriginalPath;
          originalLinkBtn.innerHTML = ICONS.DOWNLOAD;
          originalLinkBtn.title = "Download original";
          originalLinkBtn.target = "_blank";
          originalLinkBtn.rel = "noopener noreferrer";
          originalLinkBtn.addEventListener("click", (e) => e.stopPropagation());
          actionsContainer.appendChild(originalLinkBtn);
          const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(fullOriginalPath)}`;
          const lensBtn = document.createElement("a");
          lensBtn.className = "kui-action-btn";
          lensBtn.href = lensLink;
          lensBtn.title = "Search with Google Lens";
          lensBtn.target = "_blank";
          lensBtn.rel = "noopener noreferrer";
          lensBtn.innerHTML = ICONS.LENS;
          lensBtn.addEventListener("click", (e) => e.stopPropagation());
          actionsContainer.appendChild(lensBtn);
          wrapper.appendChild(actionsContainer);
        }
      }
      thumbList.appendChild(wrapper);
      return newThumbLink;
    });

    if (kuiState.isPreloadEnabled) {
      imageLinks.forEach((link, i) => {
        const urlToPreload = link.dataset.originalPath || link.href;
        if (i > 0) {
          const img = new Image();
          img.src = urlToPreload;
        }
      });
    }

    previewImage.addEventListener("click", () => {
      lightboxModule.open(imageLinks, currentIndex);
    });

    setActive(0);
    sanitizeDuplicates();
  } finally {
    if (initializingContainer === originalFilesContainer) initializingContainer = null;
  }
}
