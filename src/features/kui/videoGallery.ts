import { SELECTORS } from '../../config/selectors';
import { VideoData } from '../../types';
import { button, ensureKit, kitIcon, tooltip } from '../../ui/kit';
import { t } from '../../i18n';
import { plyrI18n } from '../../i18n/plyr';
import { icon } from '../../config/icons';
import { readStored, writeStored } from '../../state/gmStorage';
import { installDoubleTapSeek } from './doubleTapSeek';

// Loop toggle in Plyr's control bar. Plyr has the L key and player.loop but no button, and it swaps the <video>
// on every source change, so the choice is kept here (and stored) and put back on each new video.
const LOOP_KEY = 'kui.video.loop';
function addLoopControl(player: Plyr): void {
  let looping = readStored<boolean>(LOOP_KEY, false) === true;
  const label = (): string => t(looping ? 'kui.video.loopOff' : 'kui.video.loopOn');
  const tip = document.createElement('span');
  tip.className = 'plyr__tooltip';
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'plyr__controls__item plyr__control kui-plyr-loop';
  control.append(icon('repeat'), tip);
  const render = (): void => {
    control.classList.toggle('plyr__control--pressed', looping);
    control.setAttribute('aria-pressed', String(looping));
    control.setAttribute('aria-label', label());
    tip.textContent = label();
  };
  const apply = (): void => {
    try {
      (player as unknown as { loop: boolean }).loop = looping;
    } catch {
      /* media not ready yet: the next ready/loadedmetadata applies it */
    }
    if (player.media) player.media.loop = looping;
    render();
  };
  const set = (value: boolean): void => {
    looping = value;
    writeStored(LOOP_KEY, value);
    apply();
  };
  control.addEventListener('click', () => set(!looping));
  // Plyr's own L shortcut flips player.loop: follow it
  const followKey = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'l' || event.ctrlKey || event.metaKey || event.altKey) return;
    setTimeout(() => {
      const now = !!player.media?.loop;
      if (now !== looping) set(now);
    }, 0);
  };
  document.addEventListener('keydown', followKey);
  player.on('destroy', () => document.removeEventListener('keydown', followKey));
  const place = (): void => {
    const controls = (player.elements as { controls?: HTMLElement | null }).controls;
    if (!controls) return;
    if (!control.isConnected || control.parentElement !== controls) {
      // Before the settings / PiP / fullscreen group at the right end
      const anchor = controls.querySelector('[data-plyr="settings"], .plyr__menu, [data-plyr="pip"], [data-plyr="fullscreen"]');
      const item = anchor?.closest('.plyr__controls__item, .plyr__menu') || anchor;
      if (item && item.parentElement === controls) controls.insertBefore(control, item);
      else controls.appendChild(control);
    }
    apply();
  };
  player.on('ready', place);
  player.on('loadedmetadata', place);
  place();
}

let activePlayer: Plyr | null = null;
let fluidGuard: MutationObserver | null = null;
let removeDoubleTapSeek: (() => void) | null = null;

export function destroyVideoGallery(): void {
  fluidGuard?.disconnect();
  fluidGuard = null;
  removeDoubleTapSeek?.();
  removeDoubleTapSeek = null;
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
          title: summary || src.split("/").pop()?.split("?")[0] || t('kui.video.untitled', { n: index + 1 }),
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
        || t('kui.video.untitled', { n: index + 1 });

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

  ensureKit();
  const videoList = document.createElement("div");
  videoList.className = "kui-video-list kdl-scope";

  const playerArea = document.createElement("div");
  playerArea.className = "kui-video-player-area";

  const playerContainer = document.createElement("div");
  // Tokens only (no kit reset, which would undo Plyr's control styles); kuiPlyr.styles maps --plyr-* to them
  playerContainer.className = "kui-video-player-container kdl-tokens";

  const mainPlayerElement = document.createElement("video");
  mainPlayerElement.id = "kui-main-video-player";
  mainPlayerElement.preload = "metadata";

  const syncToggle = () => {
    const collapsed = videoList.classList.contains("kui-collapsed");
    playlistToggle.replaceChildren(kitIcon(collapsed ? "panel-left-open" : "panel-left-close"));
    playlistToggle.setAttribute("aria-expanded", String(!collapsed));
  };
  // Self-scoped: the kit tokens apply to the button without putting Plyr's player inside a .kdl-scope
  const playlistToggle = tooltip(button({
    variant: "secondary",
    size: "icon",
    ariaLabel: t('kui.video.togglePlaylist'),
    className: "kdl-scope kui-video-playlist-toggle",
    onClick: () => {
      videoList.classList.add("kui-anim");
      videoList.classList.toggle("kui-collapsed");
      syncToggle();
    },
  }), { text: t('kui.video.togglePlaylist'), side: "left" });

  playerContainer.appendChild(mainPlayerElement);
  playerContainer.appendChild(playlistToggle);
  playerArea.appendChild(playerContainer);

  galleryLayout.appendChild(videoList);
  galleryLayout.appendChild(playerArea);

  if (videosData.length <= 1) {
    videoList.classList.add("kui-collapsed");
  }
  syncToggle();

  // A layout removed without cleanup (e.g. by sanitizeDuplicates) leaves its player alive
  destroyVideoGallery();

  const player = new Plyr(mainPlayerElement, {
    tooltips: { controls: true, seek: true },
    keyboard: { focused: true, global: true },
    storage: { enabled: true, key: "kui_plyr" },
    i18n: plyrI18n()
  });
  activePlayer = player;
  removeDoubleTapSeek = installDoubleTapSeek(playerContainer, () => player.media);
  addLoopControl(player);

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
