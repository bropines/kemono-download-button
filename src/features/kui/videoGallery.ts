import { SELECTORS } from '../../config/selectors';
import { VideoData } from '../../types';

let activePlayer: Plyr | null = null;
let fluidGuard: MutationObserver | null = null;

export function destroyVideoGallery(): void {
  fluidGuard?.disconnect();
  fluidGuard = null;
  if (!activePlayer) return;
  try {
    // Unbinds Plyr's window-level keyboard listeners, which otherwise outlive the removed layout
    activePlayer.destroy();
  } catch (e) {}
  activePlayer = null;
}

export function initializeVideoGallery(): void {
  const postBody = document.querySelector(SELECTORS.postBody);
  if (!postBody) return;

  if (postBody.classList.contains("kui-video-gallery-processed") || postBody.querySelector(".kui-video-gallery-layout"))
    return;

  const videosData: VideoData[] = [];
  let videoSectionContainer: HTMLElement | null = null;
  const elementsToHide: HTMLElement[] = [];

  const hideElement = (el: HTMLElement | null) => {
    if (!el || elementsToHide.includes(el)) return;
    elementsToHide.push(el);
  };

  const postVideosList = postBody.querySelector("ul.post__videos, .kui-video-section ul, ul[style*='post__videos']");

  if (postVideosList) {
    videoSectionContainer = (postVideosList.closest(".kui-video-section") || postVideosList.parentElement) as HTMLElement;
    hideElement(postVideosList as HTMLElement);
    // Direct children only: Fluid Player injects its own <ul><li> context menu inside each item
    const items = Array.from(postVideosList.querySelectorAll<HTMLElement>(":scope > li"));
    items.forEach((item, index) => {
      hideElement(item);
      const summary = item.querySelector("summary")?.textContent?.trim();
      const sourceEl = item.querySelector<HTMLSourceElement>("video source") || item.querySelector<HTMLVideoElement>("video");
      const linkEl = item.querySelector<HTMLAnchorElement>("a[href]");
      const src = sourceEl?.src || linkEl?.href || "";

      if (src) {
        videosData.push({
          title: summary || src.split("/").pop()?.split("?")[0] || `Video ${index + 1}`,
          src: src
        });
      }
    });
  }

  const rawVideos = Array.from(postBody.querySelectorAll<HTMLVideoElement>("video"));
  rawVideos.forEach((video, index) => {
    if (video.closest(".kui-video-gallery-layout"))
      return;

    const parentContainer = (video.closest("li, .post__file, .fileThumb, figure, div.post__video, .fluid_video_wrapper") as HTMLElement) || video;
    hideElement(parentContainer);
    hideElement(video);

    const src = video.src || video.querySelector("source")?.src || "";
    if (src && !videosData.some(v => v.src === src)) {
      const titleCandidate = parentContainer.querySelector("summary, figcaption, .file-name, a")?.textContent?.trim()
        || video.getAttribute("title")
        || src.split("/").pop()?.split("?")[0]
        || `Video ${index + 1}`;

      videosData.push({
        title: titleCandidate,
        src: src
      });
      if (!videoSectionContainer) {
        videoSectionContainer = parentContainer.parentElement;
      }
    }
  });

  postBody.querySelectorAll<HTMLElement>(".fluid_video_wrapper").forEach((wrapper) => {
    if (!wrapper.closest(".kui-video-gallery-layout")) {
      hideElement(wrapper);
    }
  });

  if (videosData.length === 0) return;

  const targetParent = videoSectionContainer || document.querySelector(SELECTORS.postFilesContainer) || postBody;
  targetParent.classList.add("kui-video-gallery-processed");

  elementsToHide.forEach((el) => {
    el.classList.add("kui-hidden-original");
    el.style.setProperty("display", "none", "important");
  });

  const galleryLayout = document.createElement("div");
  galleryLayout.className = "kui-video-gallery-layout kui-post-section";

  const videoList = document.createElement("div");
  videoList.className = "kui-video-list";

  const playerArea = document.createElement("div");
  playerArea.className = "kui-video-player-area";

  const playerContainer = document.createElement("div");
  playerContainer.className = "kui-video-player-container";

  const mainPlayerElement = document.createElement("video");
  mainPlayerElement.id = "kui-main-video-player";
  mainPlayerElement.preload = "metadata";

  const playlistToggle = document.createElement("div");
  playlistToggle.className = "kui-video-playlist-toggle";
  playlistToggle.addEventListener("click", () => {
    videoList.classList.toggle("kui-collapsed");
  });

  playerContainer.appendChild(mainPlayerElement);
  playerContainer.appendChild(playlistToggle);
  playerArea.appendChild(playerContainer);

  galleryLayout.appendChild(videoList);
  galleryLayout.appendChild(playerArea);

  if (videosData.length <= 1) {
    videoList.classList.add("kui-collapsed");
  }

  // A layout removed without cleanup (e.g. by sanitizeDuplicates) leaves its player alive
  destroyVideoGallery();

  const player = new Plyr(mainPlayerElement, {
    tooltips: { controls: true, seek: true },
    keyboard: { focused: true, global: true },
    storage: { enabled: true, key: "kui_plyr" }
  });
  activePlayer = player;

  player.on("loadedmetadata", () => {
    const videoEl = player.media;
    const container = player.elements.container;
    if (!videoEl || !container) return;
    const { videoWidth, videoHeight } = videoEl;
    if (videoWidth > 0 && videoHeight > 0) {
      container.style.aspectRatio = `${videoWidth} / ${videoHeight}`;
    }
  });

  let listItems: HTMLElement[] = [];
  let activeIndex = 0;
  const setActiveVideo = (index: number) => {
    activeIndex = index;
    // Plyr replaces the <video> element on every source change, so styles must not rely on its id
    player.source = {
      type: "video",
      title: videosData[index].title,
      sources: [{ src: videosData[index].src, type: "video/mp4" }]
    };
    listItems.forEach((item, idx) => item.classList.toggle("kui-video-item-active", idx === index));
  };

  videosData.forEach((video, index) => {
    const listItem = document.createElement("div");
    listItem.className = "kui-video-list-item";
    listItem.textContent = video.title;
    listItem.title = video.title;
    listItem.addEventListener("click", () => setActiveVideo(index));
    videoList.appendChild(listItem);
    listItems.push(listItem);
  });

  if (postVideosList && postVideosList.parentElement) {
    postVideosList.parentElement.appendChild(galleryLayout);
  } else {
    targetParent.appendChild(galleryLayout);
  }

  setActiveVideo(0);

  // The site runs fluidPlayer() on every <video> in the document (pawchive: getElementsByTagName("video")),
  // possibly after we built the gallery. Reloading the source makes Plyr drop the captured media element
  // together with Fluid's wrapper and controls.
  let fluidEvictions = 0;
  fluidGuard = new MutationObserver(() => {
    if (fluidEvictions >= 3 || !playerContainer.querySelector(".fluid_video_wrapper")) return;
    fluidEvictions++;
    setActiveVideo(activeIndex);
  });
  fluidGuard.observe(playerContainer, { childList: true, subtree: true });
}
