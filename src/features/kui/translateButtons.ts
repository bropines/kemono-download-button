import type { IconName } from '../../config/icons';
import { SELECTORS } from '../../config/selectors';
import { isTranslationConfigured, translateText } from '../../services/translators';
import { appState, getSettings, state } from '../../state/store';
import { showMessage } from '../../ui/toast';
import { el } from '../../utils/dom';
import { ensureKit, kitIcon, setTooltip } from '../../ui/kit';
import { t, type UiKey } from '../../i18n';

type TranslateKind = 'title' | 'content' | 'comment';
type ButtonState = 'idle' | 'loading' | 'translated';

// What each button translates. A button always sits outside its target, whose text gets replaced.
const TARGETS: Record<TranslateKind, (button: HTMLElement) => HTMLElement | null> = {
  title: () => document.querySelector<HTMLElement>('.post__title > span'),
  content: () => document.querySelector<HTMLElement>(SELECTORS.postContent),
  comment: (button) => button.closest('.comment')?.querySelector<HTMLElement>(':scope > .comment__body .comment__message') ?? null,
};
// Children that must survive translation untouched: the service link buttons at the top of the content
const KEEP_SELECTORS: Partial<Record<TranslateKind, string>> = { content: '.kui-embed-container' };
const STATE_VIEW: Record<ButtonState, { iconName: IconName; label: UiKey }> = {
  idle: { iconName: 'languages', label: 'kui.translate.translate' },
  loading: { iconName: 'loader-circle', label: 'kui.translate.translating' },
  translated: { iconName: 'undo-2', label: 'kui.translate.showOriginal' },
};

let listenerBound = false;

function setButtonState(button: HTMLButtonElement, buttonState: ButtonState): void {
  const { iconName } = STATE_VIEW[buttonState];
  const label = t(STATE_VIEW[buttonState].label);
  button.dataset.state = buttonState;
  setTooltip(button, label);
  button.setAttribute('aria-label', label);
  button.disabled = buttonState === 'loading';
  button.setAttribute('aria-busy', String(buttonState === 'loading'));
  button.replaceChildren(kitIcon(iconName, buttonState === 'loading' ? 'kdl-ui-spin' : undefined));
}

// Runs fn with the kept children detached, so they are neither translated nor wiped by innerText
function withoutKeptChildren<T>(target: HTMLElement, kind: TranslateKind, fn: () => T): T {
  const selector = KEEP_SELECTORS[kind];
  const kept = selector ? Array.from(target.querySelectorAll<HTMLElement>(`:scope > ${selector}`)) : [];
  kept.forEach((node) => node.remove());
  try {
    return fn();
  } finally {
    if (kept.length) target.prepend(...kept);
  }
}

function restoreOriginal(button: HTMLButtonElement, target: HTMLElement, kind: TranslateKind): void {
  const original = target.dataset.kuiOriginal;
  if (original === undefined) return;
  withoutKeptChildren(target, kind, () => {
    target.innerHTML = original;
  });
  delete target.dataset.kuiOriginal;
  setButtonState(button, 'idle');
}

async function toggleTranslation(button: HTMLButtonElement): Promise<void> {
  const kind = button.dataset.kuiTranslate as TranslateKind;
  const target = TARGETS[kind]?.(button);
  if (!target || button.disabled) return;

  // The original is kept in an attribute, so it also survives a restored history snapshot
  if (target.dataset.kuiOriginal !== undefined) {
    restoreOriginal(button, target, kind);
    return;
  }

  const text = withoutKeptChildren(target, kind, () => target.innerText.trim());
  if (!text) return;

  setButtonState(button, 'loading');
  try {
    await getSettings();
    const cacheKey = `${state.settings.translationProvider}:${state.settings.translationLanguage}:${text}`;
    const translated = appState.translationCache[cacheKey] ?? (await translateText(text, state.settings));
    appState.translationCache[cacheKey] = translated;
    withoutKeptChildren(target, kind, () => {
      target.dataset.kuiOriginal = target.innerHTML;
      target.innerText = translated;
    });
    setButtonState(button, 'translated');
  } catch (error: any) {
    setButtonState(button, 'idle');
    showMessage(t('kui.translate.failed', { message: error.message }), 'error');
  }
}

function bindListener(): void {
  if (listenerBound) return;
  listenerBound = true;
  // Delegated: buttons come back from htmx history snapshots without their listeners
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('.kui-translate-btn');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    toggleTranslation(button);
  });
}

/** Keeps a translate button for `kind` inside `host` in line with the settings; safe to call repeatedly. */
export function syncTranslateButton(host: Element | null, kind: TranslateKind, canTranslate = true): void {
  if (!host) return;
  const button = host.querySelector<HTMLButtonElement>(`:scope > .kui-translate-btn[data-kui-translate="${kind}"]`);
  const enabled = canTranslate && state.settings.showTranslateButton && isTranslationConfigured(state.settings);
  if (!enabled) {
    // A translated element keeps its button so it can still be switched back
    if (button && button.dataset.state !== 'translated') button.remove();
    return;
  }
  if (button) {
    // One restored from an htmx history snapshot lost its tooltip listeners; setTooltip attaches them again
    setTooltip(button, t(STATE_VIEW[(button.dataset.state as ButtonState) || 'idle']?.label ?? STATE_VIEW.idle.label));
    return;
  }

  bindListener();
  ensureKit();
  // Self-scoped kit ghost icon button: it sits inside the site's headings and comment footers
  const created = el('button', {
    type: 'button',
    className: 'kdl-scope kdl-ui-btn kdl-ui-btn--ghost kdl-ui-btn--size-icon kui-translate-btn',
    dataset: { kuiTranslate: kind },
  });
  setButtonState(created, 'idle');
  host.appendChild(created);
}

export function initializePostTranslation(): void {
  const title = document.querySelector('.post__title');
  syncTranslateButton(title, 'title', !!title?.querySelector(':scope > span'));

  // The content button goes into its "Content" heading
  const content = document.querySelector<HTMLElement>(SELECTORS.postContent);
  let heading = content?.previousElementSibling ?? null;
  while (heading?.tagName === 'SCRIPT') heading = heading.previousElementSibling;
  syncTranslateButton(heading?.tagName === 'H2' ? heading : null, 'content', !!content?.textContent?.trim());
}

/** Restores every translated element and removes the buttons, leaving the site's own markup. */
export function removeTranslateButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.kui-translate-btn').forEach((button) => {
    const kind = button.dataset.kuiTranslate as TranslateKind;
    const target = TARGETS[kind]?.(button);
    if (target) restoreOriginal(button, target, kind);
    button.remove();
  });
}
