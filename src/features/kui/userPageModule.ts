import { iconSvg } from '../../config/icons';
import { SELECTORS } from '../../config/selectors';

export const userPageModule = {
  init() {
    if (document.getElementById("kui-copy-username-btn")) {
      return;
    }
    const nameContainer = document.querySelector(SELECTORS.userHeaderName);
    const nameSpan = nameContainer?.querySelector('[itemprop="name"]');
    if (!nameContainer || !nameSpan) {
      return;
    }
    const username = nameSpan.textContent?.trim();
    if (!username) return;

    const copyButton = document.createElement("button");
    copyButton.id = "kui-copy-username-btn";
    copyButton.title = "Copy nickname";
    copyButton.innerHTML = iconSvg('clipboard');
    copyButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(username).then(() => {
        copyButton.innerHTML = iconSvg('clipboard-check');
        setTimeout(() => {
          copyButton.innerHTML = iconSvg('clipboard');
        }, 1500);
      }).catch((err) => {
        console.error("[KUI] Failed to copy text: ", err);
        copyButton.innerHTML = iconSvg('circle-x');
        setTimeout(() => {
          copyButton.innerHTML = iconSvg('clipboard');
        }, 1500);
      });
    });
    nameContainer.appendChild(copyButton);
  },
  cleanup() {}
};
