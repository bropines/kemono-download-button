import { SELECTORS } from '../../config/selectors';
import { kuiState } from '../../state/kuiState';
import { showMessage } from '../../ui/toast';
import { parseGluedUrl } from '../../utils/urlSanitizer';

export interface ServiceBrand {
  name: string;
  gradient: string;
  textColor: string;
  borderColor: string;
}

export function getServiceBrand(hostname: string): ServiceBrand {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  if (host.includes("mega.nz") || host.includes("mega.co.nz")) {
    return { name: "Mega", gradient: "linear-gradient(135deg, #d9272e, #a81c22)", textColor: "#ffffff", borderColor: "#f87171" };
  }
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    return { name: "Google Drive", gradient: "linear-gradient(135deg, #1a73e8, #1254ad)", textColor: "#ffffff", borderColor: "#60a5fa" };
  }
  if (host.includes("dropbox.com")) {
    return { name: "Dropbox", gradient: "linear-gradient(135deg, #0061ff, #0046b8)", textColor: "#ffffff", borderColor: "#3b82f6" };
  }
  if (host.includes("mediafire.com")) {
    return { name: "MediaFire", gradient: "linear-gradient(135deg, #1271ff, #0b4db8)", textColor: "#ffffff", borderColor: "#60a5fa" };
  }
  if (host.includes("pixeldrain.com")) {
    return { name: "Pixeldrain", gradient: "linear-gradient(135deg, #6366f1, #4338ca)", textColor: "#ffffff", borderColor: "#818cf8" };
  }
  if (host.includes("workupload.com")) {
    return { name: "Workupload", gradient: "linear-gradient(135deg, #0d9488, #0f766e)", textColor: "#ffffff", borderColor: "#2dd4bf" };
  }
  if (host.includes("gofile.io")) {
    return { name: "Gofile", gradient: "linear-gradient(135deg, #d97706, #b45309)", textColor: "#ffffff", borderColor: "#fbbf24" };
  }
  if (host.includes("terabox.com") || host.includes("teraboxapp.com")) {
    return { name: "Terabox", gradient: "linear-gradient(135deg, #0284c7, #0369a1)", textColor: "#ffffff", borderColor: "#38bdf8" };
  }
  if (host.includes("onedrive") || host.includes("1drv.ms")) {
    return { name: "OneDrive", gradient: "linear-gradient(135deg, #0078d4, #004e8c)", textColor: "#ffffff", borderColor: "#60a5fa" };
  }
  if (host.includes("catbox.moe")) {
    return { name: "Catbox", gradient: "linear-gradient(135deg, #e11d48, #9f1239)", textColor: "#ffffff", borderColor: "#fda4af" };
  }
  if (host.includes("x.com") || host.includes("twitter.com")) {
    return { name: "X (Twitter)", gradient: "linear-gradient(135deg, #1f2937, #111827)", textColor: "#f9fafb", borderColor: "#4b5563" };
  }
  if (host.includes("patreon.com")) {
    return { name: "Patreon", gradient: "linear-gradient(135deg, #f96854, #c43e2b)", textColor: "#ffffff", borderColor: "#fca5a5" };
  }
  if (host.includes("fanbox.cc") || host.includes("pixiv.net")) {
    return { name: "Fanbox", gradient: "linear-gradient(135deg, #d97706, #92400e)", textColor: "#ffffff", borderColor: "#fde047" };
  }
  if (host.includes("subscribestar")) {
    return { name: "SubscribeStar", gradient: "linear-gradient(135deg, #164e63, #083344)", textColor: "#ffffff", borderColor: "#22d3ee" };
  }
  if (host.includes("discord.com") || host.includes("discord.gg")) {
    return { name: "Discord", gradient: "linear-gradient(135deg, #5865f2, #3742fa)", textColor: "#ffffff", borderColor: "#a5b4fc" };
  }
  if (host.includes("t.me") || host.includes("telegram.org")) {
    return { name: "Telegram", gradient: "linear-gradient(135deg, #0284c7, #0369a1)", textColor: "#ffffff", borderColor: "#38bdf8" };
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return { name: "YouTube", gradient: "linear-gradient(135deg, #dc2626, #991b1b)", textColor: "#ffffff", borderColor: "#fca5a5" };
  }

  return { name: host, gradient: "linear-gradient(135deg, #374151, #1f2937)", textColor: "#f3f4f6", borderColor: "#4b5563" };
}

export function linkifyTextNodes(container: Element): void {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  // Separate non-global regex: .test() on a /g regex keeps lastIndex and skips URLs in later nodes
  const hasUrl = /https?:\/\//i;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement && ["A", "SCRIPT", "STYLE", "TEXTAREA"].includes(node.parentElement.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return hasUrl.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });

  const nodesToReplace: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    nodesToReplace.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  nodesToReplace.forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;
    const text = node.nodeValue || "";
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    urlRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const { url, password, trailing } = parseGluedUrl(match[0]);

      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
      }

      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      fragment.appendChild(a);
      if (trailing) {
        // processEmbeds only sees the clean href afterwards, so remember what was split off
        a.dataset.kuiTrailing = trailing;
        if (password) a.dataset.kuiPassword = password;
        fragment.appendChild(document.createTextNode(trailing));
      }

      lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  });
}

export function restructureLayout(processEmbedsCallback?: () => void): void {
  const postBody = document.querySelector(SELECTORS.postBody);
  if (!postBody || postBody.classList.contains("kui-processed"))
    return;
  const findNextProperSibling = (element: Element): Element | null => {
    let sibling = element.nextElementSibling;
    while (sibling) {
      if (sibling.tagName !== "SCRIPT") return sibling;
      sibling = sibling.nextElementSibling;
    }
    return null;
  };
  const wrapGroup = (h2: Element, content: Element, customClass = "") => {
    if (h2 && content && h2.parentNode && !h2.parentNode.parentElement?.classList.contains("kui-post-section") && !(h2.parentNode as HTMLElement).classList.contains("kui-post-section")) {
      const wrapper = document.createElement("div");
      wrapper.className = `kui-post-section ${customClass}`.trim();
      h2.parentNode.insertBefore(wrapper, h2);
      wrapper.appendChild(h2);
      wrapper.appendChild(content);
    }
  };
  postBody.querySelectorAll("h2").forEach((h2) => {
    const title = h2.textContent?.trim().toLowerCase();
    const content = findNextProperSibling(h2);
    if (!content) return;
    if (title === "downloads" && content.matches(".post__attachments")) {
      wrapGroup(h2, content);
    } else if (title === "content" && content.matches(SELECTORS.postContent)) {
      wrapGroup(h2, content);
      if (typeof processEmbedsCallback === "function") processEmbedsCallback();
    } else if (title === "files" && content.matches(SELECTORS.postFilesContainer)) {
      wrapGroup(h2, content);
    } else if (title === "videos" && content.tagName === "UL") {
      wrapGroup(h2, content, "kui-video-section");
    }
  });
  const comments = document.querySelector(SELECTORS.postComments);
  if (comments && comments.parentNode && !comments.closest(".kui-post-section")) {
    const wrapper = document.createElement("div");
    wrapper.className = "kui-post-section";
    comments.parentNode.insertBefore(wrapper, comments);
    wrapper.appendChild(comments);
  }
  postBody.classList.add("kui-processed");
  formatAttachmentButtons();
  hideEmptySections();
}

export function formatAttachmentButtons(): void {
  const attachmentLinks = document.querySelectorAll<HTMLAnchorElement>(".post__attachment-link");
  attachmentLinks.forEach((link) => {
    if (link.classList.contains("kui-attachment-styled")) return;
    link.classList.add("kui-attachment-styled");

    const rawText = link.textContent?.trim() || "";
    let rawFileName = link.getAttribute("download") || rawText.replace(/^Download\s+/i, "").trim() || "file";

    try {
      rawFileName = decodeURIComponent(rawFileName);
    } catch (e) {}

    const iconSpan = document.createElement("span");
    iconSpan.style.display = "inline-flex";
    iconSpan.style.alignItems = "center";
    iconSpan.style.justifyContent = "center";
    iconSpan.style.width = "14px";
    iconSpan.style.height = "14px";
    iconSpan.style.flexShrink = "0";
    iconSpan.innerHTML = `<svg viewBox="0 0 24 24" style="width: 100%; height: 100%;"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>`;

    const textSpan = document.createElement("span");
    textSpan.style.overflow = "hidden";
    textSpan.style.textOverflow = "ellipsis";
    textSpan.style.whiteSpace = "nowrap";
    textSpan.textContent = `Download ${rawFileName}`;

    link.innerHTML = "";
    link.title = `Download ${rawFileName}`;
    link.appendChild(iconSpan);
    link.appendChild(textSpan);
  });
}

// True when the link is alone on its line (between <br>s / block edges), optionally after a short
// label like "Mega:"; text glued after it (a password split off by parseGluedUrl) doesn't count
function isOnOwnLine(link: HTMLAnchorElement, trailing: string): boolean {
  const lineText = (dir: "previousSibling" | "nextSibling") => {
    let text = "";
    for (let node = link[dir]; node && node.nodeName !== "BR"; node = node[dir]) {
      text = dir === "previousSibling" ? (node.textContent || "") + text : text + (node.textContent || "");
    }
    return text.trim();
  };
  const before = lineText("previousSibling");
  let after = lineText("nextSibling");
  if (trailing && after.startsWith(trailing)) after = after.slice(trailing.length).trim();
  const isLabel = before.length <= 40 && /[:：\-–—→>]$/.test(before);
  return (!before || isLabel) && !after;
}

function copyPassword(password: string): void {
  try {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(password);
    } else {
      navigator.clipboard?.writeText(password);
    }
    showMessage("Password copied to clipboard", "info");
  } catch (e) {}
}

export function processEmbeds(): void {
  const content = document.querySelector(SELECTORS.postContent);
  if (!content || content.classList.contains("kui-embed-processed")) return;

  linkifyTextNodes(content);

  const links = Array.from(content.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const linkActions = new Map<string, string>();
  const linkPasswords = new Map<string, string>();
  const elementsToRemove = new Set<Element>();

  links.forEach((link) => {
    try {
      if (!link.href || !link.protocol.startsWith("http")) return;
      // The site may have linkified glued text itself, so the href can carry "Password:xyz" too
      const glued = parseGluedUrl(link.href);
      const password = glued.password || link.dataset.kuiPassword || null;
      const trailing = glued.trailing || link.dataset.kuiTrailing || "";
      const url = new URL(glued.url);
      const linkHostname = url.hostname.replace(/^www\./, "");

      if (linkHostname.includes("kemono") || linkHostname.includes("coomer") || linkHostname.includes("pawchive")) {
        return;
      }

      let bestMatch: { domain: string; action: string } | null = null;
      const domainParts = linkHostname.split(".");
      const domainsToCheck = [linkHostname];
      if (domainParts.length > 2) {
        for (let i = 1; i < domainParts.length - 1; i++) {
          const parentDomain = domainParts.slice(i).join(".");
          domainsToCheck.push("*." + parentDomain);
          domainsToCheck.push(parentDomain);
        }
      }

      for (const domain of [...new Set(domainsToCheck)]) {
        if (kuiState.embedRules[domain]) {
          bestMatch = { domain, action: kuiState.embedRules[domain] };
          break;
        }
      }

      const action = bestMatch ? bestMatch.action : "button";

      if (action === "hide" || action === "button") {
        // A link inside a sentence keeps its place (the button is still added); "hide" always removes
        if (action === "hide" || isOnOwnLine(link, trailing)) {
          // Keep glued text (e.g. the password) readable in the post once the link itself is removed
          if (trailing && link.textContent?.trim().endsWith(trailing)) {
            link.after(document.createTextNode(trailing));
          }
          elementsToRemove.add(link);
        }
        if (!linkActions.has(url.href)) {
          linkActions.set(url.href, action);
        }
        if (password && !linkPasswords.has(url.href)) {
          linkPasswords.set(url.href, password);
        }
      }
    } catch (e) {}
  });

  const urlsToConvert: string[] = [];
  linkActions.forEach((action, url) => {
    if (action === "button") urlsToConvert.push(url);
  });

  if (urlsToConvert.length > 0) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "kui-embed-container";
    urlsToConvert.forEach((url) => {
      try {
        const urlObject = new URL(url);
        const brand = getServiceBrand(urlObject.hostname);

        const button = document.createElement("a");
        button.href = url;
        button.className = "kui-embed-button";
        button.target = "_blank";
        button.rel = "noopener noreferrer";
        button.title = url;

        button.style.background = brand.gradient;
        button.style.color = brand.textColor;
        button.style.borderColor = brand.borderColor;

        const favicon = document.createElement("img");
        favicon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.origin}`;
        favicon.onerror = () => {
          favicon.style.display = "none";
        };

        const text = document.createElement("span");
        text.className = "kui-embed-button-text";
        text.textContent = brand.name;

        button.appendChild(favicon);
        button.appendChild(text);

        const password = linkPasswords.get(url);
        if (password) {
          const passwordChip = document.createElement("span");
          passwordChip.className = "kui-embed-password";
          passwordChip.textContent = `🔑 ${password}`;
          button.appendChild(passwordChip);
          button.title = `${url}\nPassword: ${password} (copied on click)`;
          button.addEventListener("click", () => copyPassword(password));
        }
        buttonContainer.appendChild(button);
      } catch (e) {}
    });
    content.prepend(buttonContainer);
  }

  elementsToRemove.forEach((link) => {
    const parent = link.parentElement;
    if (parent && (parent.tagName === "P" || parent.tagName === "DIV") && parent.textContent?.trim() === link.textContent?.trim()) {
      parent.remove();
    } else {
      link.remove();
    }
  });

  let changed: boolean;
  do {
    changed = false;
    content.querySelectorAll("p, div, h3").forEach((el) => {
      if (el.innerHTML.trim() === "" || el.innerHTML.trim().toLowerCase() === "<br>") {
        el.remove();
        changed = true;
      }
    });
  } while (changed);
  // Removed links leave stray <br>s: drop only leading/trailing ones and runs longer than one blank line,
  // otherwise the post's lines would merge into one
  const isBlankText = (node: ChildNode | null) => !!node && node.nodeType === Node.TEXT_NODE && !node.textContent?.trim();
  const meaningfulSibling = (node: ChildNode, dir: "previousSibling" | "nextSibling") => {
    let sibling = node[dir];
    while (sibling && isBlankText(sibling)) sibling = sibling[dir];
    return sibling;
  };
  content.querySelectorAll("br").forEach((br) => {
    const prev = meaningfulSibling(br, "previousSibling");
    const next = meaningfulSibling(br, "nextSibling");
    const isThirdInRun = prev?.nodeName === "BR" && meaningfulSibling(prev, "previousSibling")?.nodeName === "BR";
    if (!prev || !next || isThirdInRun) br.remove();
  });
  content.classList.add("kui-embed-processed");
  hideEmptySections();
}

export function hideEmptySections(): void {
  if (!kuiState.isHideEmptySectionsEnabled) {
    document.querySelectorAll(".kui-post-section-empty-hidden").forEach((el) => {
      el.classList.remove("kui-post-section-empty-hidden");
      (el as HTMLElement).style.removeProperty("display");
    });
    return;
  }

  document.querySelectorAll(".kui-post-section").forEach((section) => {
    const h2 = section.querySelector("h2");
    const title = h2?.textContent?.trim().toLowerCase() || "";

    let isEmpty = false;

    if (title === "content") {
      const content = section.querySelector(SELECTORS.postContent);
      if (content) {
        const text = content.textContent?.trim() || "";
        const hasImgs = content.querySelector("img, video, iframe, canvas") !== null;
        const hasEmbeds = content.querySelector(".kui-embed-button, a[href]") !== null;
        if (!text && !hasImgs && !hasEmbeds) {
          isEmpty = true;
        }
      } else {
        isEmpty = true;
      }
    } else if (title === "comments" || section.querySelector(SELECTORS.postComments)) {
      const noComments = section.querySelector(".post__comments--no-comments") !== null ||
                         section.textContent?.toLowerCase().includes("no comments found") ||
                         !section.querySelector(".post__comment");
      if (noComments) {
        isEmpty = true;
      }
    } else if (title === "downloads") {
      const attachments = section.querySelector(".post__attachments");
      if (!attachments || attachments.children.length === 0) {
        isEmpty = true;
      }
    } else if (title === "files") {
      const files = section.querySelector(SELECTORS.postFilesContainer);
      if (!files || files.children.length === 0) {
        isEmpty = true;
      }
    }

    if (isEmpty) {
      section.classList.add("kui-post-section-empty-hidden");
      (section as HTMLElement).style.display = "none";
    } else {
      section.classList.remove("kui-post-section-empty-hidden");
      (section as HTMLElement).style.removeProperty("display");
    }
  });
}
