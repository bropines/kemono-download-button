// "shadcn skin: pages" part: text pages as card panels, the FAQ as an accordion with a filter, account and
// key cards, the home page over its blurred background art.
//
// Two small DOM transforms, both reversible and idempotent (update runs on every mutation batch):
// - panels: loose heading + paragraph runs (importer notes) are wrapped in <div class="kdl-sk-panel">
// - accordion: FAQ sections become <details>; the heading moves into the <summary>
// Every wrapper carries data-kdl-sk; undo() puts the original nodes back in place and removes the
// wrappers, on unmount and before htmx stores a history snapshot.

import type { KdlModule } from '../../core/types';
import { el } from '../../utils/dom';
import { button, ensureKit, input, kitScope } from '../../ui/kit';

const MARK = 'data-kdl-sk';
const HEADINGS = 'h1, h2, h3, h4';
const level = (node: Element): number => Number(node.tagName.slice(1)) || 9;
const isHeading = (node: Element | null): node is HTMLElement => !!node && node.matches(HEADINGS);

/** Puts every node we wrapped back where it was */
function undo(): void {
  document.querySelectorAll(`[${MARK}="tools"]`).forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>(`[${MARK}="acc"]`).forEach((details) => {
    const heading = details.querySelector(':scope > summary > :is(h1, h2, h3, h4, h5, h6)');
    const body = details.querySelector(':scope > .kdl-sk-acc__body');
    details.replaceWith(...(heading ? [heading] : []), ...(body ? Array.from(body.childNodes) : []));
  });
  document.querySelectorAll<HTMLElement>(`[${MARK}="panel"]`).forEach((panel) => panel.replaceWith(...Array.from(panel.childNodes)));
  document.querySelectorAll(`[${MARK}-root]`).forEach((node) => node.removeAttribute(`${MARK}-root`));
  document.querySelectorAll(".kdl-sk-filtered").forEach((node) => node.classList.remove("kdl-sk-filtered"));
}

/** Siblings after `start` up to (not including) the next heading at `stopLevel` or above */
function sectionNodes(start: Element, stopLevel: number): ChildNode[] {
  const nodes: ChildNode[] = [];
  let next = start.nextSibling;
  while (next && !(next instanceof Element && isHeading(next) && level(next) <= stopLevel)) {
    nodes.push(next);
    next = next.nextSibling;
  }
  return nodes;
}

// ---- Panels: importer notes ----

const PANEL_ROOTS = '.site-section--importer';

function wrapPanels(): void {
  document.querySelectorAll<HTMLElement>(`${PANEL_ROOTS}:not([${MARK}-root])`).forEach((root) => {
    root.setAttribute(`${MARK}-root`, '');
    // Only headings after the form: the page title stays where it is
    const form = root.querySelector(':scope > form');
    Array.from(root.children)
      .filter((child) => isHeading(child) && level(child) >= 2 && (!form || form.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING))
      .forEach((heading) => {
        const panel = el('div', { className: 'kdl-sk-panel' });
        panel.setAttribute(MARK, 'panel');
        // Any heading ends a panel: an h3 after an h2 gets its own
        const nodes = sectionNodes(heading, 9);
        heading.before(panel);
        panel.append(heading, ...nodes);
      });
  });
}

// ---- Accordion: FAQ ----

function faqRoot(): HTMLElement | null {
  if (!/\/(faq|importer\/tutorial)(\/|$)/.test(window.location.pathname)) return null;
  return document.querySelector<HTMLElement>('main .site-section--faq, main #page, main .page');
}

function applyFilter(root: HTMLElement, query: string, empty: HTMLElement): void {
  const q = query.trim().toLowerCase();
  let shown = 0;
  root.querySelectorAll<HTMLDetailsElement>(`:scope > [${MARK}="acc"]`).forEach((details) => {
    const match = !q || (details.textContent || '').toLowerCase().includes(q);
    details.hidden = !match;
    if (match) shown++;
    if (q && match) details.open = true;
  });
  // Group headings (and the intro) only show while something under them does
  root.querySelectorAll<HTMLElement>(`:scope > :not([${MARK}], h1)`).forEach((node) => {
    if (!q) {
      node.classList.remove('kdl-sk-filtered');
      return;
    }
    let next = node.nextElementSibling;
    let visible = false;
    while (next && !(isHeading(next) && !next.hasAttribute(MARK))) {
      if (next.getAttribute(MARK) === 'acc' && !(next as HTMLElement).hidden) visible = true;
      next = next.nextElementSibling;
    }
    node.classList.toggle('kdl-sk-filtered', !visible || !isHeading(node));
  });
  empty.hidden = shown > 0;
}

function toolbar(root: HTMLElement): HTMLElement {
  ensureKit();
  const empty = el('p', { className: 'kdl-sk-faq-empty', textContent: 'No answers match.' });
  empty.hidden = true;
  const setAll = (open: boolean) =>
    root.querySelectorAll<HTMLDetailsElement>(`:scope > [${MARK}="acc"]:not([hidden])`).forEach((details) => (details.open = open));
  const search = input({ type: 'search', placeholder: 'Filter questions…', ariaLabel: 'Filter questions', className: 'kdl-sk-faq-search', onInput: (value) => applyFilter(root, value, empty) });
  const bar = kitScope(
    [
      search,
      button({ label: 'Expand all', variant: 'outline', size: 'sm', onClick: () => setAll(true) }),
      button({ label: 'Collapse all', variant: 'ghost', size: 'sm', onClick: () => setAll(false) }),
      empty,
    ],
    { className: 'kdl-sk-faq-tools' }
  );
  bar.setAttribute(MARK, 'tools');
  return bar;
}

function buildAccordion(): void {
  const root = faqRoot();
  if (!root || root.hasAttribute(`${MARK}-root`)) return;
  const all = Array.from(root.children).filter(isHeading).filter((h) => level(h) >= 2);
  if (all.length < 2) return;
  root.setAttribute(`${MARK}-root`, '');
  // The deepest heading level present is the question; shallower ones stay as group titles
  const itemLevel = all.some((h) => level(h) === 3) ? 3 : level(all[0]);
  const hash = decodeURIComponent(window.location.hash.slice(1));
  all.filter((h) => level(h) === itemLevel).forEach((heading) => {
    const body = el('div', { className: 'kdl-sk-acc__body' });
    const summary = el('summary', { className: 'kdl-sk-acc__summary' });
    const details = el('details', { className: 'kdl-sk-acc' }, [summary, body]);
    details.setAttribute(MARK, 'acc');
    const nodes = sectionNodes(heading, itemLevel);
    heading.before(details);
    summary.append(heading);
    body.append(...nodes);
    if (hash && (heading.id === hash || body.querySelector(`[id="${CSS.escape(hash)}"]`))) details.open = true;
  });
  // The intro before the first heading reads as one panel
  const first = root.querySelector(`:scope > :is(h2, h3, [${MARK}="acc"])`);
  const title = root.querySelector(':scope > h1');
  const intro: ChildNode[] = [];
  let node = title ? title.nextSibling : root.firstChild;
  while (node && node !== first) {
    intro.push(node);
    node = node.nextSibling;
  }
  if (intro.some((n) => n instanceof Element)) {
    const panel = el('div', { className: 'kdl-sk-panel' });
    panel.setAttribute(MARK, 'panel');
    (first || root).before(panel);
    if (!first) root.append(panel);
    panel.append(...intro);
  }
  (title || root.firstElementChild)?.after(toolbar(root));
}

export const shadcnPagesTransform: Pick<KdlModule, 'mount' | 'update' | 'unmount' | 'beforeSnapshot'> = {
  mount() {
    wrapPanels();
    buildAccordion();
  },
  update() {
    wrapPanels();
    buildAccordion();
  },
  unmount: undo,
  beforeSnapshot: undo,
};
