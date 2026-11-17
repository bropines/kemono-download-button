import { KUI_STORAGE_KEYS } from '../../config/storage';
import { readStored, writeStored } from '../../state/gmStorage';
import { state } from '../../state/store';
import { LENS_DISPLAY_CHANGED, LENS_DISPLAY_PREVIEW, NothingToTranslate, renderTranslation } from '../../services/lensImages';
import { createLensPanel } from '../../ui/components/kui/lensPanel';
import { lensIcon } from '../../ui/components/kui/lensIcon';
import { button, kitIcon, portal, toast, tooltip } from '../../ui/kit';
import { lensPanelStyles } from '../../styles/components/lensPanel.styles';
import { lightboxStyles } from '../../styles/components/kuiMain.styles';
import { el } from '../../utils/dom';
import { t } from '../../i18n';

type RenderKind = 'draft' | 'final';
type IconButtonName = Parameters<typeof kitIcon>[0];

// The lightbox lives in the kit's shadow root, above every page layer, where the page's toasts can't reach:
// its messages go through the kit's toaster instead
function notify(message: string, type: 'info' | 'error' = 'info'): void {
  toast({ title: message, variant: type === 'error' ? 'destructive' : 'default' });
}

const iconButton = (id: string, iconName: IconButtonName, text: string, onClick: () => void) =>
  tooltip(button({ id, icon: iconName, variant: 'secondary', size: 'icon', ariaLabel: text, className: 'kui-action-btn', onClick }), { text, side: 'bottom' });

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
  // The overlay and the controls updateContent and the render loop touch; rebuilt on every open
  root: null as HTMLElement | null,
  container: null as HTMLElement | null,
  downloadBtn: null as HTMLAnchorElement | null,
  lensBtn: null as HTMLAnchorElement | null,
  copyBtn: null as HTMLButtonElement | null,
  translateBtn: null as HTMLButtonElement | null,
  panelBtn: null as HTMLButtonElement | null,
  panel: null as HTMLElement | null,
  imageLinks: [] as HTMLAnchorElement[],
  currentIndex: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  lastTap: 0,
  pointers: new Map<number, { x: number; y: number }>(),
  gesture: null as null | {
    startX: number; startY: number; startOffsetX: number; startOffsetY: number; startTime: number; startZoom: number; moved: boolean; pinched: boolean;
    pinch: null | { distance: number; zoom: number; midX: number; midY: number; offsetX: number; offsetY: number };
  },
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
    this.pointers.clear();
    this.gesture = null;
    // A lightbox closed moments ago is still fading out
    this.root?.remove();
    this.build();
    if (this.panel) this.setPanelOpen(readStored(KUI_STORAGE_KEYS.LENS_PANEL_OPEN, false));
    this.updateContent();
    this.addEventListeners();
    document.body.style.overflow = "hidden";
  },
  // Builds the overlay in the kit root, outside #main, so HTMX swaps never take it and site CSS never reaches it
  build() {
    const translating = state.settings.showImageTranslateButton;
    this.downloadBtn = tooltip(
      button({ id: 'kui-lightbox-download-btn', href: '#', target: '_blank', icon: 'download', variant: 'secondary', size: 'icon', download: true, ariaLabel: t('kui.media.downloadOriginal'), className: 'kui-action-btn' }),
      { text: t('kui.media.downloadOriginal'), side: 'bottom' }
    );
    this.lensBtn = tooltip(
      button({ id: 'kui-lightbox-lens-btn', href: '#', target: '_blank', icon: lensIcon(), variant: 'secondary', size: 'icon', ariaLabel: t('kui.media.searchLens'), className: 'kui-action-btn' }),
      { text: t('kui.media.searchLens'), side: 'bottom' }
    );
    this.copyBtn = iconButton('kui-lightbox-copy-btn', 'link', t('kui.lightbox.copyLink'), () => this.handleCopyLink());
    this.translateBtn = translating ? iconButton('kui-lightbox-translate-btn', 'languages', t('kui.lens.translateToggle'), () => this.handleTranslate()) : null;
    this.panelBtn = translating ? iconButton('kui-lightbox-lens-settings-btn', 'sliders-horizontal', t('kui.lightbox.displaySettings'), () => this.setPanelOpen(!!this.panel?.hidden)) : null;
    this.panel = translating ? createLensPanel(() => this.setPanelOpen(false)) : null;
    this.canvas = el('canvas', { id: 'kui-image-canvas' });
    this.container = el('div', { id: 'kui-lightbox-img-container' }, [this.canvas]);
    const navButton = (direction: -1 | 1) =>
      tooltip(
        button({
          icon: direction < 0 ? 'chevron-left' : 'chevron-right',
          variant: 'secondary',
          size: 'icon',
          ariaLabel: direction < 0 ? t('kui.lightbox.previousImage') : t('kui.lightbox.nextImage'),
          className: `kui-lightbox-nav ${direction < 0 ? 'prev' : 'next'}`,
          onClick: () => this.navigate(direction),
        }),
        { text: direction < 0 ? t('kui.lightbox.previousHint') : t('kui.lightbox.nextHint'), side: direction < 0 ? 'right' : 'left' }
      );

    this.root = el('div', { id: 'kui-lightbox', className: 'kui-lightbox kui-active' }, [
      el('style', { textContent: lightboxStyles + lensPanelStyles }),
      el('div', { className: 'kui-lightbox-top-actions' }, [
        this.downloadBtn,
        this.copyBtn,
        this.lensBtn,
        this.translateBtn,
        this.panelBtn,
        iconButton('kui-lightbox-close-btn', 'x', t('kui.lightbox.close'), () => this.close()),
      ]),
      navButton(-1),
      navButton(1),
      this.container,
      this.panel,
    ]);
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', t('kui.lightbox.label'));
    portal(this.root);
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
  },
  close() {
    if (!this.isActive) return;
    const lightboxEl = this.root;
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
    if (this.downloadBtn) this.downloadBtn.href = originalPath;
    if (this.lensBtn) this.lensBtn.href = lensLink;
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
      notify(t('kui.lightbox.loadFailed'), "error");
    };
    this.image.src = originalPath;
  },
  navigate(direction: number) {
    this.currentIndex = (this.currentIndex + this.imageLinks.length + direction) % this.imageLinks.length;
    this.updateContent();
  },
  handleCopyLink() {
    const btn = this.copyBtn;
    if (!btn || btn.disabled) return;
    const currentLink = this.imageLinks[this.currentIndex];
    const urlToCopy = currentLink.dataset.originalPath || currentLink.href;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      btn.replaceChildren(kitIcon('check'));
      btn.disabled = true;
      setTimeout(() => {
        btn.replaceChildren(kitIcon('link'));
        btn.disabled = false;
      }, 1500);
    });
  },
  addEventListeners() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundHandleKeydown, true);
    const container = this.container;
    if (container) {
      container.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
      // Pointer events cover mouse, touch and pen alike; touch-action: none hands every gesture to us
      // instead of the browser (which would scroll or zoom the page underneath)
      container.style.touchAction = "none";
      container.addEventListener("pointerdown", this.handlePointerDown.bind(this));
      container.addEventListener("pointermove", this.handlePointerMove.bind(this));
      container.addEventListener("pointerup", this.handlePointerUp.bind(this));
      container.addEventListener("pointercancel", this.handlePointerUp.bind(this));
      container.addEventListener("lostpointercapture", this.handlePointerUp.bind(this));
    }
    this.boundResize = this.resizeCanvas.bind(this);
    window.addEventListener("resize", this.boundResize);
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
    const { root, panel } = this;
    if (!root || !panel) return;
    panel.hidden = !open;
    root.classList.toggle("kui-lens-panel-open", open);
    if (this.panelBtn) {
      this.panelBtn.dataset.state = open ? 'on' : 'off';
      this.panelBtn.setAttribute('aria-pressed', String(open));
    }
    writeStored(KUI_STORAGE_KEYS.LENS_PANEL_OPEN, open);
  },
  setTranslateButton(busy: boolean) {
    const btn = this.translateBtn;
    if (!btn) return;
    // Not setButtonLoading: that disables the button, and translation must stay switchable off mid-render
    btn.replaceChildren(kitIcon(busy ? 'loader-circle' : 'languages', busy ? 'kdl-ui-spin' : undefined));
    btn.setAttribute('aria-busy', String(busy));
    btn.dataset.state = this.translateMode ? 'on' : 'off';
    btn.setAttribute('aria-pressed', String(this.translateMode));
    btn.setAttribute('aria-label', this.translateMode ? t('kui.lens.showOriginal') : t('kui.lens.translateImage'));
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
            if (this.askedHere) notify(t('kui.lens.error', { message: e.message }), 'info');
            continue;
          }
          this.translateMode = false;
          notify(t('kui.lens.error', { message: (e as Error).message }), 'error');
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
    // The panel is in a shadow root: at document level the target is the kit host, so look along the path
    if (e.key !== "Escape" && this.panel && e.composedPath().includes(this.panel)) {
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
    const container = this.container;
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
  // ---- Pointer gestures: drag to pan, pinch to zoom, double tap to zoom in/out, swipe to change picture ----
  zoomAt(newZoom: number, x: number, y: number) {
    const zoom = Math.min(20, Math.max(0.05, newZoom));
    this.offsetX = x - (x - this.offsetX) * (zoom / this.zoom);
    this.offsetY = y - (y - this.offsetY) * (zoom / this.zoom);
    this.zoom = zoom;
  },
  fitZoom(): number {
    if (!this.isDrawable() || !this.canvas) return 1;
    return Math.min(this.canvas.width / this.image.width, this.canvas.height / this.image.height, 1);
  },
  localPoint(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = this.canvas!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  },
  handlePointerDown(e: PointerEvent) {
    if (!this.canvas || (e.pointerType === "mouse" && e.button !== 0)) return;
    // Buttons and panels over the picture keep their own clicks
    if ((e.target as Element | null)?.closest?.("button, a, input, select, .kui-lens-panel")) return;
    e.preventDefault();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const point = this.localPoint(e);
    this.pointers.set(e.pointerId, point);
    if (this.pointers.size === 1) {
      this.gesture = { startX: point.x, startY: point.y, startOffsetX: this.offsetX, startOffsetY: this.offsetY, startTime: Date.now(), startZoom: this.zoom, moved: false, pinched: false, pinch: null };
      this.canvas.style.cursor = "grabbing";
    } else if (this.pointers.size === 2 && this.gesture) {
      const [a, b] = [...this.pointers.values()];
      this.gesture.pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: this.zoom, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2, offsetX: this.offsetX, offsetY: this.offsetY };
      this.gesture.moved = true;
      this.gesture.pinched = true;
    }
  },
  handlePointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId) || !this.gesture) return;
    e.preventDefault();
    const point = this.localPoint(e);
    this.pointers.set(e.pointerId, point);
    const g = this.gesture;
    if (g.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      // Zoom around the starting midpoint, then follow the fingers as they move together
      const zoom = Math.min(20, Math.max(0.05, g.pinch.zoom * (distance / g.pinch.distance)));
      this.offsetX = g.pinch.midX - (g.pinch.midX - g.pinch.offsetX) * (zoom / g.pinch.zoom) + (midX - g.pinch.midX);
      this.offsetY = g.pinch.midY - (g.pinch.midY - g.pinch.offsetY) * (zoom / g.pinch.zoom) + (midY - g.pinch.midY);
      this.zoom = zoom;
      this.drawImage();
      return;
    }
    const dx = point.x - g.startX;
    const dy = point.y - g.startY;
    if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true;
    if (!g.moved) return;
    // At fit size a horizontal drag is a swipe between pictures: the picture follows the finger sideways only
    const atFit = this.zoom <= this.fitZoom() * 1.01;
    if (atFit && e.pointerType !== "mouse") {
      this.offsetX = g.startOffsetX + dx;
      this.offsetY = g.startOffsetY;
    } else {
      this.offsetX = g.startOffsetX + dx;
      this.offsetY = g.startOffsetY + dy;
    }
    this.drawImage();
  },
  handlePointerUp(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    const point = this.pointers.get(e.pointerId)!;
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (!g) return;
    if (this.pointers.size === 1 && g.pinch) {
      // One finger lifted after a pinch: carry on panning with the other from where it is
      const [rest] = [...this.pointers.values()];
      this.gesture = { ...g, pinch: null, startX: rest.x, startY: rest.y, startOffsetX: this.offsetX, startOffsetY: this.offsetY };
      return;
    }
    if (this.pointers.size > 0) return;
    this.gesture = null;
    if (this.canvas) this.canvas.style.cursor = "grab";
    if (e.type !== "pointerup") return;
    const dx = point.x - g.startX;
    const dt = Date.now() - g.startTime;
    // A swipe only counts when the picture was and still is at fit size, and no pinch happened on the way
    const atFit = !g.pinched && g.startZoom <= this.fitZoom() * 1.01 && this.zoom <= this.fitZoom() * 1.01;
    if (atFit && g.moved && e.pointerType !== "mouse" && Math.abs(dx) > 60 && dt < 600) {
      this.navigate(dx < 0 ? 1 : -1);
      return;
    }
    if (atFit && g.moved && e.pointerType !== "mouse") {
      this.resetPanZoom();
      return;
    }
    if (!g.moved && e.pointerType !== "mouse") {
      const now = Date.now();
      if (now - this.lastTap < 300) {
        this.lastTap = 0;
        // Double tap: zoom in 2.5x at the finger, or back to fit when already zoomed
        if (this.zoom > this.fitZoom() * 1.05) this.resetPanZoom();
        else {
          this.zoomAt(this.fitZoom() * 2.5, point.x, point.y);
          this.drawImage();
        }
      } else this.lastTap = now;
    }
  },
};
