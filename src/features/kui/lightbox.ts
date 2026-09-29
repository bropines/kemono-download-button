import { ICONS, iconSvg } from '../../config/icons';
import { KUI_STORAGE_KEYS } from '../../config/storage';
import { readStored, writeStored } from '../../state/gmStorage';
import { state } from '../../state/store';
import { LENS_DISPLAY_CHANGED, LENS_DISPLAY_PREVIEW, NothingToTranslate, renderTranslation } from '../../services/lensImages';
import { createLensPanel } from '../../ui/components/kui/lensPanel';
import { showMessage } from '../../ui/toast';

type RenderKind = 'draft' | 'final';

export const lightboxModule = {
  isActive: false,
  // Translation is a mode, not a property of one picture: it stays on while paging through a post
  translateMode: false,
  // The translation is on screen (the mode is on and its render has arrived)
  isTranslated: false,
  // The translated picture, at a multiple of the original's size, drawn over the same coordinates
  translation: null as HTMLCanvasElement | null,
  // Where the original actually loaded from: the site's own link when the API-derived one failed
  originalSrc: '',
  // Renders finish out of order; one started for an earlier picture or mode must not reach the screen
  renderToken: 0,
  rendering: false,
  wantedRender: null as RenderKind | null,
  // Set by the button, cleared by paging: a page without text is only worth a message when asked about
  askedHere: false,
  boundDisplayPreview: null as (() => void) | null,
  boundDisplayChanged: null as (() => void) | null,
  imageLinks: [] as HTMLAnchorElement[],
  currentIndex: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  lastTap: 0,
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  image: new Image(),
  boundHandleKeydown: null as ((e: KeyboardEvent) => void) | null,
  boundResize: null as (() => void) | null,
  init() {
    this.isActive = false;
    this.imageLinks = [];
    this.currentIndex = 0;
  },
  // `translated`: the picture was already translated where it was opened from, so it opens translated
  open(links: HTMLAnchorElement[], index: number, translated = false) {
    if (this.isActive) return;
    this.isActive = true;
    this.translateMode = translated && state.settings.showImageTranslateButton;
    this.imageLinks = links;
    this.currentIndex = index;
    const translateButton = state.settings.showImageTranslateButton
      ? `<button id="kui-lightbox-translate-btn" class="kui-action-btn" title="Translate the text in this image">${iconSvg('languages')}</button>
         <button id="kui-lightbox-lens-settings-btn" class="kui-action-btn" title="Translation display settings">${iconSvg('sliders-horizontal')}</button>`
      : '';
    const lightboxHTML = `
      <div id="kui-lightbox" class="kui-active">
          <div class="kui-lightbox-top-actions">
              <a id="kui-lightbox-download-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" download title="Download Original">${ICONS.DOWNLOAD}</a>
              <button id="kui-lightbox-copy-btn" class="kui-action-btn" title="Copy Link to Original">${ICONS.LINK}</button>
              <a id="kui-lightbox-lens-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" title="Search with Google Lens">
                  ${ICONS.LENS}
              </a>
              ${translateButton}
              <button id="kui-lightbox-close-btn" class="kui-action-btn" title="Close (Esc)">${ICONS.CLOSE}</button>
          </div>
          <button class="kui-lightbox-nav prev" title="Previous (←)">${iconSvg('chevron-left')}</button>
          <button class="kui-lightbox-nav next" title="Next (→)">${iconSvg('chevron-right')}</button>
          <div id="kui-lightbox-img-container">
              <canvas id="kui-image-canvas"></canvas>
          </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
    this.canvas = document.getElementById("kui-image-canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
    if (state.settings.showImageTranslateButton) {
      document.getElementById("kui-lightbox")?.appendChild(createLensPanel(() => this.setPanelOpen(false)));
      this.setPanelOpen(readStored(KUI_STORAGE_KEYS.LENS_PANEL_OPEN, false));
    }
    this.updateContent();
    this.addEventListeners();
    document.body.style.overflow = "hidden";
  },
  close() {
    if (!this.isActive) return;
    const lightboxEl = document.getElementById("kui-lightbox");
    if (lightboxEl) {
      lightboxEl.classList.remove("kui-active");
      setTimeout(() => lightboxEl.remove(), 200);
    }
    this.removeEventListeners();
    this.isActive = false;
    this.wantedRender = null;
    this.translation = null;
    document.body.style.overflow = "";
  },
  updateContent() {
    const currentLinkData = this.imageLinks[this.currentIndex];
    if (!currentLinkData || !this.canvas) return;
    const originalPath = currentLinkData.dataset.originalPath || currentLinkData.href;
    const lensLink = `https://lens.google.com/v3/upload?url=${encodeURIComponent(originalPath)}`;
    const downloadBtn = document.getElementById("kui-lightbox-download-btn") as HTMLAnchorElement | null;
    const lensBtn = document.getElementById("kui-lightbox-lens-btn") as HTMLAnchorElement | null;
    if (downloadBtn) downloadBtn.href = originalPath;
    if (lensBtn) lensBtn.href = lensLink;
    // Another picture: its translation is still to come, and a render running for the last one is stale
    this.isTranslated = false;
    this.translation = null;
    this.originalSrc = "";
    this.askedHere = false;
    this.renderToken++;
    this.setTranslateButton(false);

    this.canvas.style.opacity = "0.5";
    this.image.onload = () => {
      if (this.canvas) this.canvas.style.opacity = "1";
      this.originalSrc = this.image.src;
      this.resizeCanvas();
      this.resetPanZoom();
      this.drawImage();
      // After the original, so the translation is made from the address that actually loaded
      this.requestRender('final');
    };
    // The site's own link is the fallback: it still opens when the API-derived original does not
    const fallbackPath = currentLinkData.href;
    this.image.onerror = () => {
      if (fallbackPath && this.image.src !== fallbackPath) {
        this.image.src = fallbackPath;
        return;
      }
      if (this.canvas) this.canvas.style.opacity = "1";
      showMessage("Could not load this image", "error");
    };
    this.image.src = originalPath;
  },
  navigate(direction: number) {
    this.currentIndex = (this.currentIndex + this.imageLinks.length + direction) % this.imageLinks.length;
    this.updateContent();
  },
  handleCopyLink() {
    const btn = document.getElementById("kui-lightbox-copy-btn") as HTMLButtonElement | null;
    if (!btn || btn.disabled) return;
    const currentLink = this.imageLinks[this.currentIndex];
    const urlToCopy = currentLink.dataset.originalPath || currentLink.href;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      const originalIcon = btn.innerHTML;
      btn.innerHTML = ICONS.SUCCESS;
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.disabled = false;
      }, 1500);
    });
  },
  addEventListeners() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundHandleKeydown, true);
    const container = document.getElementById("kui-lightbox-img-container");
    if (container) {
      container.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
      container.addEventListener("mousedown", this.handleMouseDown.bind(this));
      container.addEventListener("mousemove", this.handleMouseMove.bind(this));
      container.addEventListener("mouseup", this.handleMouseUp.bind(this));
      container.addEventListener("mouseleave", this.handleMouseUp.bind(this));
      container.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
      container.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
      container.addEventListener("touchend", this.handleTouchEnd.bind(this));
    }
    this.boundResize = this.resizeCanvas.bind(this);
    window.addEventListener("resize", this.boundResize);
    document.getElementById("kui-lightbox-close-btn")?.addEventListener("click", this.close.bind(this));
    document.querySelector(".kui-lightbox-nav.prev")?.addEventListener("click", () => this.navigate(-1));
    document.querySelector(".kui-lightbox-nav.next")?.addEventListener("click", () => this.navigate(1));
    document.getElementById("kui-lightbox-copy-btn")?.addEventListener("click", this.handleCopyLink.bind(this));
    document.getElementById("kui-lightbox-translate-btn")?.addEventListener("click", this.handleTranslate.bind(this));
    document.getElementById("kui-lightbox-lens-settings-btn")?.addEventListener("click", () => {
      this.setPanelOpen(!document.getElementById("kui-lightbox")?.classList.contains("kui-lens-panel-open"));
    });
    // A slider moving asks for quick drafts; letting go asks for the full-quality picture.
    // A translation that is off screen is simply dropped: turning it back on renders it afresh.
    this.boundDisplayPreview = () => this.onDisplaySettings('draft');
    this.boundDisplayChanged = () => this.onDisplaySettings('final');
    document.addEventListener(LENS_DISPLAY_PREVIEW, this.boundDisplayPreview);
    document.addEventListener(LENS_DISPLAY_CHANGED, this.boundDisplayChanged);
  },
  onDisplaySettings(kind: RenderKind) {
    if (this.translateMode) this.requestRender(kind);
    else this.translation = null;
  },
  setPanelOpen(open: boolean) {
    const lightbox = document.getElementById("kui-lightbox");
    const panel = lightbox?.querySelector<HTMLElement>(".kui-lens-panel");
    if (!lightbox || !panel) return;
    panel.hidden = !open;
    lightbox.classList.toggle("kui-lens-panel-open", open);
    document.getElementById("kui-lightbox-lens-settings-btn")?.classList.toggle("kui-active", open);
    writeStored(KUI_STORAGE_KEYS.LENS_PANEL_OPEN, open);
  },
  setTranslateButton(busy: boolean) {
    const btn = document.getElementById("kui-lightbox-translate-btn") as HTMLButtonElement | null;
    if (!btn) return;
    btn.innerHTML = busy ? iconSvg('loader-circle', 'kdl-icon kdl-spin') : iconSvg('languages');
    btn.classList.toggle("kui-active", this.translateMode);
    btn.title = this.translateMode ? "Show the original" : "Translate the text in this image";
  },
  handleTranslate() {
    if (this.translateMode) {
      // Off, including while a render is still running: its result is dropped
      this.translateMode = false;
      this.isTranslated = false;
      this.wantedRender = null;
      this.renderToken++;
      this.setTranslateButton(false);
      this.drawImage();
      return;
    }
    this.translateMode = true;
    this.askedHere = true;
    if (this.translation) {
      this.isTranslated = true;
      this.setTranslateButton(false);
      this.drawImage();
      return;
    }
    this.requestRender('final');
  },
  requestRender(kind: RenderKind) {
    if (!this.translateMode || !this.isDrawable()) return;
    // A final render outranks a waiting draft, and a draft never downgrades a waiting final
    this.wantedRender = kind === 'final' || this.wantedRender === 'final' ? 'final' : 'draft';
    if (!this.rendering) void this.renderLoop();
  },
  // One render at a time, always of the latest settings: requests made while one runs collapse into the next
  async renderLoop() {
    this.rendering = true;
    this.setTranslateButton(true);
    try {
      while (this.wantedRender && this.translateMode && this.isActive) {
        const draft = this.wantedRender === 'draft';
        this.wantedRender = null;
        const token = this.renderToken;
        const link = this.imageLinks[this.currentIndex];
        if (!link) break;
        try {
          const rendered = await renderTranslation(this.originalSrc || link.dataset.originalPath || link.href, draft);
          if (!this.isActive || token !== this.renderToken || !this.translateMode) continue;
          this.translation = rendered;
          this.isTranslated = true;
          this.drawImage();
        } catch (e) {
          if (!this.isActive || token !== this.renderToken) continue;
          this.isTranslated = false;
          if (e instanceof NothingToTranslate) {
            // A page with no text (a splash page) leaves translation on for the pages after it
            if (this.askedHere) showMessage(`Lens: ${e.message}`, 'info');
            continue;
          }
          this.translateMode = false;
          showMessage(`Lens: ${(e as Error).message}`, 'error');
        }
      }
    } finally {
      this.rendering = false;
      if (this.isActive) this.setTranslateButton(false);
    }
  },
  removeEventListeners() {
    if (this.boundHandleKeydown) {
      document.removeEventListener("keydown", this.boundHandleKeydown, true);
    }
    if (this.boundDisplayPreview) {
      document.removeEventListener(LENS_DISPLAY_PREVIEW, this.boundDisplayPreview);
      this.boundDisplayPreview = null;
    }
    if (this.boundDisplayChanged) {
      document.removeEventListener(LENS_DISPLAY_CHANGED, this.boundDisplayChanged);
      this.boundDisplayChanged = null;
    }
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize);
      this.boundResize = null;
    }
  },
  handleKeydown(e: KeyboardEvent) {
    if (!this.isActive) return;
    // In the display panel arrows move sliders and carets. Keep keys from the lightbox and from the site,
    // which opens the next post on ArrowRight, but leave the default action so the control still moves
    if (e.key !== "Escape" && (e.target as HTMLElement | null)?.closest?.(".kui-lens-panel")) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }
    if (["ArrowLeft", "ArrowRight", "Escape"].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    if (e.key === "Escape") this.close();
    if (e.key === "ArrowLeft") this.navigate(-1);
    if (e.key === "ArrowRight") this.navigate(1);
  },
  resizeCanvas() {
    const container = document.getElementById("kui-lightbox-img-container");
    if (!this.canvas) return;
    const width = container?.clientWidth || window.innerWidth;
    const height = container?.clientHeight || window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.drawImage();
  },
  // Only a loaded image can be drawn: one that is loading or failed makes drawImage throw
  isDrawable(): boolean {
    return this.image.complete && this.image.naturalWidth > 0;
  },
  drawImage() {
    if (!this.isDrawable() || !this.ctx || !this.canvas) return;
    const shown = this.isTranslated && this.translation ? this.translation : this.image;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.zoom, this.zoom);
    // Always in the original's size, whatever the resolution of what is shown: the translation is the
    // same picture at a multiple of it, so zoom and position mean the same for both and survive a toggle
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(shown, 0, 0, this.image.naturalWidth, this.image.naturalHeight);
    this.ctx.restore();
  },
  resetPanZoom() {
    if (!this.isDrawable() || !this.canvas) return;
    const hRatio = this.canvas.width / this.image.width;
    const vRatio = this.canvas.height / this.image.height;
    this.zoom = Math.min(hRatio, vRatio, 1);
    this.offsetX = (this.canvas.width - this.image.width * this.zoom) / 2;
    this.offsetY = (this.canvas.height - this.image.height * this.zoom) / 2;
    this.drawImage();
  },
  handleWheel(e: WheelEvent) {
    e.preventDefault();
    if (!this.canvas) return;
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newZoom = Math.max(0.1, this.zoom + delta * this.zoom);
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.offsetX = mouseX - (mouseX - this.offsetX) * (newZoom / this.zoom);
    this.offsetY = mouseY - (mouseY - this.offsetY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.drawImage();
  },
  handleMouseDown(e: MouseEvent) {
    if (e.button !== 0 || !this.canvas) return;
    e.preventDefault();
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
    this.canvas.style.cursor = "grabbing";
  },
  handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      this.offsetX = e.clientX - this.dragStartX;
      this.offsetY = e.clientY - this.dragStartY;
      this.drawImage();
    }
  },
  handleMouseUp() {
    this.isDragging = false;
    if (this.canvas) {
      this.canvas.style.cursor = "grab";
    }
  },
  handleTouchStart(e: TouchEvent) {
    const now = new Date().getTime();
    const timeSince = now - this.lastTap;
    if (timeSince < 300 && timeSince > 0) {
      this.resetPanZoom();
      e.preventDefault();
      return;
    }
    this.lastTap = now;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isDragging = true;
      this.dragStartX = touch.clientX - this.offsetX;
      this.dragStartY = touch.clientY - this.offsetY;
    }
  },
  handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 1 && this.isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      this.offsetX = touch.clientX - this.dragStartX;
      this.offsetY = touch.clientY - this.dragStartY;
      this.drawImage();
    }
  },
  handleTouchEnd() {
    this.isDragging = false;
  }
};
