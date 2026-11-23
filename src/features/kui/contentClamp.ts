import { SELECTORS } from '../../config/selectors';
import { isCloaked } from '../../core/cloak';
import { t } from '../../i18n';
import { addKitStyles, button, dialog, ensureKit, kitIcon } from '../../ui/kit';

// Long post texts are cut to a number of lines with a fade. The cut itself is CSS keyed on <html> (set at
// document start), so the page is drawn short from the first paint and nothing jumps when the controls arrive:
// they sit over the faded last lines. "Show more" opens the text in place, the other button in a kit dialog.

const CLAMP_ATTR = 'data-kdl-post-clamp';
const LINES_VAR = '--kdl-post-lines';
const CLAMPED = 'kui-content-clamped';
const EXPANDED = 'kui-content-expanded';
const EASE_MS = 250;

export function setContentClampLines(value: unknown): void {
  const lines = Math.max(0, Math.round(Number(value) || 0));
  const root = document.documentElement;
  if (lines > 0) {
    root.setAttribute(CLAMP_ATTR, '');
    root.style.setProperty(LINES_VAR, String(lines));
  } else {
    root.removeAttribute(CLAMP_ATTR);
    root.style.removeProperty(LINES_VAR);
  }
  current?.measure();
}

export const contentClampStyles = `
html[${CLAMP_ATTR}] .post__content:not(.${EXPANDED}) {
  max-height: calc(var(${LINES_VAR}) * 1.7em);
  max-height: calc(var(${LINES_VAR}) * 1lh);
  overflow: hidden;
}
html[${CLAMP_ATTR}] .post__content.${CLAMPED}:not(.${EXPANDED}) {
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 5.5em), transparent calc(100% - 2.25rem));
  mask-image: linear-gradient(to bottom, black calc(100% - 5.5em), transparent calc(100% - 2.25rem));
}
.kui-content-more { position: relative; display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 8px; margin-top: -2rem; }
.post__content.${EXPANDED} + .kui-content-more { margin-top: 12px; }
html:not([${CLAMP_ATTR}]) .kui-content-more { display: none; }
/* One row on a phone: the dialog button keeps only its icon (its name stays as aria-label) */
@media (max-width: 480px) { .kui-content-more .kui-content-full > span { display: none; } }
`;

// The dialog lives in the kit shadow root, where the site's text styles do not reach: a reading layout of its own
const DIALOG_STYLES = `
.kui-post-text { color: var(--kdl-foreground); font-size: 15px; line-height: 1.7; overflow-wrap: anywhere; }
.kui-post-text p { margin: 0 0 1em; }
.kui-post-text > :last-child { margin-bottom: 0; }
.kui-post-text a { color: inherit; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--kdl-muted-foreground); }
.kui-post-text a:hover { text-decoration-color: var(--kdl-foreground); }
.kui-post-text img, .kui-post-text video { max-width: 100%; height: auto; border-radius: var(--kdl-radius); }
.kui-post-text blockquote { margin: 1em 0; padding-left: 1em; border-left: 2px solid var(--kdl-border); color: var(--kdl-muted-foreground); }
.kui-post-text pre { padding: 0.75rem 1rem; border: 1px solid var(--kdl-border); border-radius: var(--kdl-radius); background: var(--kdl-muted); overflow-x: auto; }
.kui-post-text :is(ul, ol) { margin: 0 0 1em; padding-left: 1.4em; }
.kui-post-text :is(h1, h2, h3, h4) { margin: 1.4em 0 0.5em; font-weight: 600; line-height: 1.3; }
.kui-post-text hr { margin: 1.5em 0; border: 0; border-top: 1px solid var(--kdl-border); }
.kui-post-text table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
.kui-post-text :is(td, th) { padding: 0.35em 0.7em; border: 1px solid var(--kdl-border); }
.kui-post-text .kui-embed-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1em; }
`;

interface ClampState {
  content: HTMLElement;
  controls: HTMLElement;
  measure: () => void;
  destroy: () => void;
}

let current: ClampState | null = null;

const reducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function openFullText(content: HTMLElement): void {
  addKitStyles('kui-post-text', DIALOG_STYLES);
  const body = document.createElement('div');
  body.className = 'kui-post-text';
  content.childNodes.forEach((node) => body.appendChild(node.cloneNode(true)));
  // A link in the dialog leaves the page it was opened over: open it beside it instead
  body.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  body.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  body.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => img.removeAttribute('loading'));
  dialog({ title: t('kui.content.dialogTitle'), size: 'lg', content: [body] }).open();
}

// Eases max-height between two pixel values, then hands it back to the stylesheet
function easeHeight(content: HTMLElement, from: number, to: number): void {
  const style = content.style;
  style.maxHeight = `${from}px`;
  style.overflow = 'hidden';
  style.transition = `max-height ${EASE_MS}ms ease`;
  void content.offsetHeight;
  requestAnimationFrame(() => {
    style.maxHeight = `${to}px`;
  });
  const done = (): void => {
    content.removeEventListener('transitionend', done);
    style.removeProperty('max-height');
    style.removeProperty('overflow');
    style.removeProperty('transition');
  };
  content.addEventListener('transitionend', done);
  window.setTimeout(done, EASE_MS + 100);
}

function setUp(content: HTMLElement): ClampState {
  ensureKit();
  const controls = document.createElement('div');
  controls.className = 'kui-content-more kdl-scope';
  const toggle = button({ label: t('kui.content.showMore'), iconRight: 'chevron-down', variant: 'secondary', size: 'sm', className: 'kui-content-toggle' });
  toggle.setAttribute('aria-expanded', 'false');
  const full = button({ label: t('kui.content.openFull'), icon: 'scroll-text', variant: 'ghost', size: 'sm', ariaLabel: t('kui.content.openFull'), className: 'kui-content-full', onClick: () => openFullText(content) });
  controls.append(toggle, full);

  const animate = (): boolean => !reducedMotion() && !isCloaked();
  const setExpanded = (expanded: boolean): void => {
    toggle.setAttribute('aria-expanded', String(expanded));
    const label = document.createElement('span');
    label.textContent = t(expanded ? 'kui.content.showLess' : 'kui.content.showMore');
    toggle.replaceChildren(label, kitIcon(expanded ? 'chevron-up' : 'chevron-down'));
  };

  toggle.addEventListener('click', () => {
    const expand = !content.classList.contains(EXPANDED);
    if (expand) {
      const from = content.clientHeight;
      content.classList.add(EXPANDED);
      if (animate()) easeHeight(content, from, content.scrollHeight);
    } else {
      const from = content.clientHeight;
      content.style.removeProperty('max-height');
      content.classList.remove(EXPANDED);
      const to = content.clientHeight;
      if (animate()) easeHeight(content, from, to);
      // Folding a long text away can leave the reader far below it: bring its heading back
      const section = content.closest('.kui-post-section') ?? content;
      if (section.getBoundingClientRect().top < 0) section.scrollIntoView({ block: 'start', behavior: animate() ? 'smooth' : 'auto' });
    }
    setExpanded(expand);
  });

  const measure = (): void => {
    if (!content.isConnected) return;
    if (content.classList.contains(EXPANDED)) return;
    const clamping = document.documentElement.hasAttribute(CLAMP_ATTR);
    const overflows = clamping && content.scrollHeight > content.clientHeight + 2;
    content.classList.toggle(CLAMPED, overflows);
    if (overflows && controls.parentNode !== content.parentNode) content.after(controls);
    else if (!overflows) controls.remove();
  };

  // Width changes and late images change how much the text needs; a clamped box keeps its height, so images
  // are also watched directly
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null;
  observer?.observe(content);
  const onLoad = (event: Event): void => {
    if ((event.target as Element | null)?.tagName === 'IMG') measure();
  };
  content.addEventListener('load', onLoad, true);
  measure();

  return {
    content,
    controls,
    measure,
    destroy: () => {
      observer?.disconnect();
      content.removeEventListener('load', onLoad, true);
      controls.remove();
      content.classList.remove(CLAMPED, EXPANDED);
      content.style.removeProperty('max-height');
      content.style.removeProperty('overflow');
      content.style.removeProperty('transition');
    },
  };
}

/** Adds the "Show more" controls to a post text taller than the line limit; idempotent, cheap on repeat calls. */
export function initializeContentClamp(): void {
  const content = document.querySelector<HTMLElement>(SELECTORS.postContent);
  if (current && current.content === content && content.isConnected) {
    current.measure();
    return;
  }
  removeContentClamp();
  if (content) current = setUp(content);
}

export function removeContentClamp(): void {
  current?.destroy();
  current = null;
}
