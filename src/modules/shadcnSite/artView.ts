// Home page: a button on the welcome card fades the whole interface out to look at the background art as it is;
// a click or tap anywhere, Esc or Back brings the page back.

import { el } from '../../utils/dom';
import { button, ensureKit, kitScope } from '../../ui/kit';
import { t } from '../../i18n';

const MARK = 'data-kdl-sk';
const VIEW_CLASS = 'kdl-art-view';
const CARD = '.site-section--home .jumbo-welcome-description';

let hint: HTMLElement | null = null;
let hintTimer: ReturnType<typeof setTimeout> | undefined;

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') leave();
}
function onPointer(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  leave();
}
function onPop(): void {
  if (document.documentElement.classList.contains(VIEW_CLASS)) leave(true);
}

function enter(): void {
  const root = document.documentElement;
  if (root.classList.contains(VIEW_CLASS)) return;
  root.classList.add(VIEW_CLASS);
  // Back on a phone closes the view instead of leaving the site
  try {
    // No htmx key in the state: htmx then leaves the Back to us instead of restoring the page from its cache
    history.pushState({ kdlArtView: true }, '');
  } catch {
    /* sandboxed */
  }
  window.addEventListener('popstate', onPop);
  document.addEventListener('keydown', onKey, true);
  // Next frame: the click that opened the view must not close it
  requestAnimationFrame(() => document.addEventListener('click', onPointer, true));
  hint?.remove();
  hint = kitScope([el('span', { textContent: t('home.artView.hint') })], { className: 'kdl-sk-art-hint' });
  hint.setAttribute(MARK, 'art-hint');
  document.body.append(hint);
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint?.classList.add('is-faded'), 2200);
}

function leave(fromHistory = false): void {
  const root = document.documentElement;
  if (!root.classList.contains(VIEW_CLASS)) return;
  root.classList.remove(VIEW_CLASS);
  window.removeEventListener('popstate', onPop);
  document.removeEventListener('keydown', onKey, true);
  document.removeEventListener('click', onPointer, true);
  clearTimeout(hintTimer);
  hint?.remove();
  hint = null;
  if (!fromHistory && history.state?.kdlArtView) history.back();
}

/** Adds the button to the home card (idempotent) */
export function installArtView(): void {
  const card = document.querySelector<HTMLElement>(CARD);
  if (!card || card.querySelector(`[${MARK}="art-view"]`)) return;
  ensureKit();
  const scope = kitScope(
    [button({ icon: 'image', variant: 'ghost', size: 'icon', ariaLabel: t('home.artView.show'), title: t('home.artView.show'), onClick: enter })],
    { className: 'kdl-sk-art-toggle' },
  );
  scope.setAttribute(MARK, 'art-view');
  card.append(scope);
}

export function uninstallArtView(): void {
  leave(true);
  document.querySelectorAll(`[${MARK}="art-view"], [${MARK}="art-hint"]`).forEach((node) => node.remove());
}
