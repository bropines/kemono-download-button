import { SELECTORS } from '../../config/selectors';
import { kuiState } from '../../state/kuiState';
import { showMessage } from '../../ui/toast';
import { parseGluedUrl } from '../../utils/urlSanitizer';
import { copyToClipboard } from '../../utils/clipboard';
import { badge, button as kitButton, ensureKit, kitIcon } from '../../ui/kit';

export interface ServiceBrand {
  name: string;
  /** Brand colour: only an accent dot when the favicon can't load, the button itself is a kit button. */
  color: string | null;
}

export function getServiceBrand(hostname: string): ServiceBrand {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  if (host.includes("mega.nz") || host.includes("mega.co.nz")) {
    return { name: "Mega", color: "#d9272e" };
  }
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    return { name: "Google Drive", color: "#1a73e8" };
  }
  if (host.includes("dropbox.com")) {
    return { name: "Dropbox", color: "#0061ff" };
  }
  if (host.includes("mediafire.com")) {
    return { name: "MediaFire", color: "#1271ff" };
  }
  if (host.includes("pixeldrain.com")) {
    return { name: "Pixeldrain", color: "#6366f1" };
  }
  if (host.includes("workupload.com")) {
    return { name: "Workupload", color: "#0d9488" };
  }
  if (host.includes("gofile.io")) {
    return { name: "Gofile", color: "#d97706" };
  }
  if (host.includes("terabox.com") || host.includes("teraboxapp.com")) {
    return { name: "Terabox", color: "#0284c7" };
  }
  if (host.includes("onedrive") || host.includes("1drv.ms")) {
    return { name: "OneDrive", color: "#0078d4" };
  }
  if (host.includes("catbox.moe")) {
    return { name: "Catbox", color: "#e11d48" };
  }
  if (host.includes("x.com") || host.includes("twitter.com")) {
    return { name: "X (Twitter)", color: "#1f2937" };
  }
  if (host.includes("patreon.com")) {
    return { name: "Patreon", color: "#f96854" };
  }
  if (host.includes("fanbox.cc") || host.includes("pixiv.net")) {
    return { name: "Fanbox", color: "#d97706" };
  }
  if (host.includes("subscribestar")) {
    return { name: "SubscribeStar", color: "#164e63" };
  }
  if (host.includes("discord.com") || host.includes("discord.gg")) {
    return { name: "Discord", color: "#5865f2" };
  }
  if (host.includes("t.me") || host.includes("telegram.org")) {
    return { name: "Telegram", color: "#0284c7" };
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return { name: "YouTube", color: "#dc2626" };
  }

  return { name: host, color: null };
}

function isKnownService(hostname: string): boolean {
  // getServiceBrand falls back to the bare host name for services it doesn't recognise
  return getServiceBrand(hostname).name !== hostname.toLowerCase().replace(/^www\./, "");
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
  if (attachmentLinks.length) ensureKit();
  attachmentLinks.forEach((link) => {
    if (link.classList.contains("kui-attachment-styled")) return;
    link.classList.add("kui-attachment-styled");

    const rawText = link.textContent?.trim() || "";
    let rawFileName = link.getAttribute("download") || rawText.replace(/^Download\s+/i, "").trim() || "file";

    try {
      rawFileName = decodeURIComponent(rawFileName);
    } catch (e) {}

    // The site's own link, dressed as a kit button; self-scoped since the list around it is the site's
    link.classList.add("kdl-scope", "kdl-ui-btn", "kdl-ui-btn--outline", "kdl-ui-btn--size-sm");
    const textSpan = document.createElement("span");
    textSpan.textContent = `Download ${rawFileName}`;

    link.replaceChildren(kitIcon("download"), textSpan);
    link.title = `Download ${rawFileName}`;
  });
}

// Nodes between the previous <br> (or the block start) and the link
function precedingLineNodes(link: HTMLAnchorElement): ChildNode[] {
  const nodes: ChildNode[] = [];
  for (let node = link.previousSibling; node && node.nodeName !== "BR"; node = node.previousSibling) nodes.unshift(node);
  return nodes;
}

// True when the link is alone on its line (between <br>s / block edges), optionally after a short
// label like "Mega:"; text glued after it (a password split off by parseGluedUrl) doesn't count
function isOnOwnLine(link: HTMLAnchorElement, trailing: string): boolean {
  const before = precedingLineNodes(link).map((node) => node.textContent || "").join("").trim();
  let after = "";
  for (let node = link.nextSibling; node && node.nodeName !== "BR"; node = node.nextSibling) after += node.textContent || "";
  after = after.trim();
  if (trailing && after.startsWith(trailing)) after = after.slice(trailing.length).trim();
  // The label is removed together with the link, so text mentioning a password never counts as one
  const isLabel = before.length <= 40 && /[:：\-–—→>]$/.test(before) && !/pass|pwd|pw\b|key|пароль|パス|密码|密碼|비밀번호/i.test(before);
  return (!before || isLabel) && !after;
}

async function copyPassword(password: string): Promise<void> {
  if (await copyToClipboard(password)) showMessage("Password copied to clipboard", "info");
  else showMessage("Could not copy the password", "warning");
}

export function processEmbeds(): void {
  const content = document.querySelector(SELECTORS.postContent);
  if (!content || content.classList.contains("kui-embed-processed")) return;

  linkifyTextNodes(content);

  const links = Array.from(content.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const linkActions = new Map<string, string>();
  const linkPasswords = new Map<string, string>();
  const elementsToRemove = new Set<Element>();
  const labelNodes = new Set<ChildNode>();

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

      // Without a rule only recognised file hosts/services become buttons; other links stay plain links
      const action = bestMatch ? bestMatch.action : isKnownService(linkHostname) ? "button" : "keep";

      if (action === "hide" || action === "button") {
        // A link inside a sentence keeps its place (the button is still added); "hide" always removes
        const ownLine = isOnOwnLine(link, trailing);
        if (action === "hide" || ownLine) {
          // Keep glued text (e.g. the password) readable in the post once the link itself is removed
          if (trailing && link.textContent?.trim().endsWith(trailing)) {
            link.after(document.createTextNode(trailing));
          }
          elementsToRemove.add(link);
          // A "Mega:"-style label only described the link, which is a button now
          if (ownLine) precedingLineNodes(link).forEach((node) => labelNodes.add(node));
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
    ensureKit();
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "kui-embed-container kdl-scope";
    urlsToConvert.forEach((url) => {
      try {
        const urlObject = new URL(url);
        const brand = getServiceBrand(urlObject.hostname);

        const button = kitButton({ href: url, target: "_blank", variant: "outline", size: "sm", className: "kui-embed-button" });
        button.title = url;

        // The host shows as its favicon; without one, as a dot in its brand colour
        const dot = document.createElement("span");
        dot.className = "kui-embed-dot";
        dot.hidden = true;
        if (brand.color) dot.style.setProperty("--kui-brand", brand.color);
        const favicon = document.createElement("img");
        favicon.alt = "";
        favicon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.origin}`;
        favicon.onerror = () => {
          favicon.remove();
          dot.hidden = false;
        };

        const text = document.createElement("span");
        text.className = "kui-embed-button-text";
        text.textContent = brand.name;

        button.append(favicon, dot, text);

        const password = linkPasswords.get(url);
        if (password) {
          button.appendChild(badge({ text: password, icon: "key-round", variant: "secondary", className: "kui-embed-password" }));
          button.title = `${url}\nPassword: ${password} (copied on click)`;
          button.addEventListener("click", () => copyPassword(password));
        }
        buttonContainer.appendChild(button);
      } catch (e) {}
    });
    content.prepend(buttonContainer);
  }

  labelNodes.forEach((node) => node.remove());
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
      // Comments are article.comment; matching "no comments found" text would also hit a comment quoting it
      isEmpty = !section.querySelector(".comment");
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
    } else if (title === "videos") {
      if (!section.querySelector("video, .kui-video-gallery-layout, .post__videos li")) {
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
