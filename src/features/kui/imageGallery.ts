import { SELECTORS } from '../../config/selectors';
import { kuiState } from '../../state/kuiState';
import { state } from '../../state/store';
import { LENS_DISPLAY_CHANGED, translateImage } from '../../services/lensImages';
import { showMessage } from '../../ui/toast';
import { button, ensureKit, kitIcon, tooltip } from '../../ui/kit';
import { lensIcon, linkButton } from '../../ui/components/kui/linkButton';
import { fetchPostFileData } from './api';
import { lightboxModule } from './lightbox';
import { GalleryLayoutElement } from '../../types';
import { sanitizeDuplicates } from '../../utils/domChecker';
import { debugModule } from '../../utils/logger';
import { resolveMediaUrl } from '../../utils/helpers';

// Per container: a slow fetch for the previous post must not block the gallery of the next one
let initializingContainer: Element | null = null;
// One gallery is shown at a time: building the next one drops the last one's display listener,
// which an HTMX swap would otherwise leave behind until the next settings change
let detachDisplayListener: (() => void) | null = null;

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
    detachDisplayListener?.();
    detachDisplayListener = null;

    ensureKit();
    const galleryLayout = document.createElement("div") as GalleryLayoutElement;
    galleryLayout.className = "kui-gallery-layout kdl-scope";
    const thumbList = document.createElement("div");
    thumbList.className = "kui-gallery-thumbnails";
    const previewContainer = document.createElement("div");
    previewContainer.className = "kui-gallery-preview";
    const previewImage = document.createElement("img");
    previewImage.className = "kui-gallery-preview-image";
    const thumbToggle = tooltip(button({
      icon: 'panel-left-close',
      variant: 'secondary',
      size: 'icon',
      ariaLabel: 'Toggle thumbnails',
      className: 'kui-gallery-thumb-toggle',
      onClick: () => {
        const collapsed = thumbList.classList.toggle("kui-collapsed");
        thumbToggle.replaceChildren(kitIcon(collapsed ? 'panel-left-open' : 'panel-left-close'));
        thumbToggle.setAttribute('aria-expanded', String(!collapsed));
      },
    }), { text: 'Toggle thumbnails', side: 'left' });
    thumbToggle.setAttribute('aria-expanded', 'true');
    previewContainer.appendChild(previewImage);
    previewContainer.appendChild(thumbToggle);

    // Lens renderings, per image index: an image translated once toggles back instantly
    const translatedByIndex = new Map<number, string>();
    let translateBtn: HTMLButtonElement | null = null;
    if (state.settings.showImageTranslateButton) {
      translateBtn = tooltip(button({
        icon: 'languages',
        variant: 'secondary',
        size: 'icon',
        ariaLabel: 'Translate the text in this image',
        className: 'kui-action-btn',
      }), { text: 'Translate / show original', side: 'right' });
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
      if (translateBtn) {
        translateBtn.dataset.state = translatedByIndex.has(currentIndex) ? "on" : "off";
        translateBtn.setAttribute("aria-pressed", String(translatedByIndex.has(currentIndex)));
      }
      thumbLinks.forEach((link) => link.classList.remove("kui-thumb-active"));
      activeThumbLink.classList.add("kui-thumb-active");
      activeThumbLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    galleryLayout.navigate = (direction: number) => setActive(currentIndex + direction);

    // Translates the image on show, and redraws it when a display setting changes
    const translateCurrent = async (): Promise<void> => {
      const btn = translateBtn;
      const link = imageLinks[currentIndex];
      if (!btn || !link) return;
      const index = currentIndex;
      btn.disabled = true;
      btn.replaceChildren(kitIcon('loader-circle', 'kdl-ui-spin'));
      try {
        // The original, not the thumbnail: Lens reads small text badly
        const translated = await translateImage(link.dataset.originalPath || link.href);
        translatedByIndex.set(index, translated);
        if (index === currentIndex) setActive(index);
      } catch (error) {
        showMessage(`Lens: ${(error as Error).message}`, 'error');
      } finally {
        btn.disabled = false;
        btn.replaceChildren(kitIcon('languages'));
      }
    };

    translateBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (translateBtn!.disabled) return;
      // Dropping the rendering shows the original again; translating it back is a cache hit
      if (translatedByIndex.delete(currentIndex)) {
        setActive(currentIndex);
        return;
      }
      void translateCurrent();
    });

    // After a display setting changes the renderings on hand are stale: redraw the one on screen
    const onDisplayChanged = (): void => {
      if (!galleryLayout.isConnected) {
        document.removeEventListener(LENS_DISPLAY_CHANGED, onDisplayChanged);
        return;
      }
      const showing = translatedByIndex.has(currentIndex);
      translatedByIndex.clear();
      if (showing) void translateCurrent();
    };
    if (translateBtn) {
      document.addEventListener(LENS_DISPLAY_CHANGED, onDisplayChanged);
      detachDisplayListener = () => document.removeEventListener(LENS_DISPLAY_CHANGED, onDisplayChanged);
    }

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
          const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(fullOriginalPath)}`;
          [
            { href: fullOriginalPath, icon: 'download' as const, text: "Download original" },
            { href: lensLink, icon: lensIcon(), text: "Search with Google Lens" },
          ].forEach(({ href, icon, text }) => {
            const action = tooltip(
              linkButton({ href, icon, variant: 'secondary', size: 'icon', ariaLabel: text, className: 'kui-action-btn' }),
              { text, side: 'left' }
            );
            action.addEventListener("click", (e) => e.stopPropagation());
            actionsContainer.appendChild(action);
          });
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
      // A translated preview opens translated
      lightboxModule.open(imageLinks, currentIndex, translatedByIndex.has(currentIndex));
    });

    setActive(0);
    sanitizeDuplicates();
  } finally {
    if (initializingContainer === originalFilesContainer) initializingContainer = null;
  }
}
