import { ICONS } from '../../config/icons';

export const lightboxModule = {
  isActive: false,
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
  init() {
    this.isActive = false;
    this.imageLinks = [];
    this.currentIndex = 0;
  },
  open(links: HTMLAnchorElement[], index: number) {
    if (this.isActive) return;
    this.isActive = true;
    this.imageLinks = links;
    this.currentIndex = index;
    const lightboxHTML = `
      <div id="kui-lightbox" class="kui-active">
          <div class="kui-lightbox-top-actions">
              <a id="kui-lightbox-download-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" download title="Download Original">${ICONS.DOWNLOAD}</a>
              <button id="kui-lightbox-copy-btn" class="kui-action-btn" title="Copy Link to Original">${ICONS.LINK}</button>
              <a id="kui-lightbox-lens-btn" class="kui-action-btn" href="#" target="_blank" rel="noopener noreferrer" title="Search with Google Lens">
                  ${ICONS.LENS}
              </a>
              <button id="kui-lightbox-close-btn" class="kui-action-btn" title="Close (Esc)">${ICONS.CLOSE}</button>
          </div>
          <button class="kui-lightbox-nav prev" title="Previous (←)">‹</button>
          <button class="kui-lightbox-nav next" title="Next (→)">›</button>
          <div id="kui-lightbox-img-container">
              <canvas id="kui-image-canvas"></canvas>
          </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
    this.canvas = document.getElementById("kui-image-canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();
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

    this.resetPanZoom();
    this.canvas.style.opacity = "0.5";
    this.image.src = "";
    this.image.onload = () => {
      if (this.canvas) this.canvas.style.opacity = "1";
      this.resizeCanvas();
      this.resetPanZoom();
      this.drawImage();
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
    window.addEventListener("resize", this.resizeCanvas.bind(this));
    document.getElementById("kui-lightbox-close-btn")?.addEventListener("click", this.close.bind(this));
    document.querySelector(".kui-lightbox-nav.prev")?.addEventListener("click", () => this.navigate(-1));
    document.querySelector(".kui-lightbox-nav.next")?.addEventListener("click", () => this.navigate(1));
    document.getElementById("kui-lightbox-copy-btn")?.addEventListener("click", this.handleCopyLink.bind(this));
  },
  removeEventListeners() {
    if (this.boundHandleKeydown) {
      document.removeEventListener("keydown", this.boundHandleKeydown, true);
    }
  },
  handleKeydown(e: KeyboardEvent) {
    if (!this.isActive) return;
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
  drawImage() {
    if (!this.image.src || !this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.drawImage(this.image, 0, 0);
    this.ctx.restore();
  },
  resetPanZoom() {
    if (!this.image.src || !this.canvas) return;
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
