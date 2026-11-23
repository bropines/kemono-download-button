import { tokenStyles } from './tokens';
import { baseStyles } from './base.styles';
import { buttonStyles } from './primitives/button.styles';
import { inputStyles } from './primitives/input.styles';
import { textareaStyles } from './primitives/textarea.styles';
import { selectStyles } from './primitives/select.styles';
import { checkboxStyles } from './primitives/checkbox.styles';
import { switchStyles } from './primitives/switch.styles';
import { sliderStyles } from './primitives/slider.styles';
import { fieldStyles } from './primitives/field.styles';
import { cardStyles } from './primitives/card.styles';
import { badgeStyles } from './primitives/badge.styles';
import { separatorStyles } from './primitives/separator.styles';
import { tabsStyles } from './primitives/tabs.styles';
import { dialogStyles } from './primitives/dialog.styles';
import { sheetStyles } from './primitives/sheet.styles';
import { popoverStyles } from './primitives/popover.styles';
import { tooltipStyles } from './primitives/tooltip.styles';
import { toastStyles } from './primitives/toast.styles';
import { progressStyles } from './primitives/progress.styles';
import { scrollAreaStyles } from './primitives/scrollArea.styles';
import { kbdStyles } from './primitives/kbd.styles';
import { emptyStateStyles } from './primitives/emptyState.styles';
import { skeletonStyles } from './primitives/skeleton.styles';

// --kdl-vh: 1% of the visible viewport. On phones vh also counts the area under the browser's own bars, so a
// dialog sized in vh ran past the top of the screen; dvh leaves them out (vh where it is unknown)
const viewportStyles = `:host, :root { --kdl-vh: 1vh; }
@supports (height: 1dvh) {
  :host, :root { --kdl-vh: 1dvh; }
}
`;

/** Every kit rule, tokens and reset first so component rules win at equal specificity. */
export const kitStyles = [
  viewportStyles,
  tokenStyles,
  baseStyles,
  buttonStyles,
  inputStyles,
  textareaStyles,
  selectStyles,
  checkboxStyles,
  switchStyles,
  sliderStyles,
  fieldStyles,
  cardStyles,
  badgeStyles,
  separatorStyles,
  tabsStyles,
  dialogStyles,
  sheetStyles,
  popoverStyles,
  tooltipStyles,
  toastStyles,
  progressStyles,
  scrollAreaStyles,
  kbdStyles,
  emptyStateStyles,
  skeletonStyles,
].join('\n');

/** Splits a selector list on top-level commas (not the ones inside :is()/:where()). */
function splitSelectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts;
}

// Kit markup inside a .kdl-scope, or a self-scoped widget that is one
const IN_SCOPE = ':is(.kdl-scope, .kdl-scope *)';

/**
 * The kit CSS for the page's light DOM. Each component rule (`.kdl-ui-*`) gets IN_SCOPE on its first
 * compound, which lifts it from one class to two: enough to beat the site's element and class+element
 * rules (`button`, `.post-card button`), while two-class overrides written for a call site
 * (`.post-card-download-controls .kdl-ui-btn--size-icon`) still win because ensureKit() puts this
 * sheet first in <head>. The shadow root keeps the plain `kitStyles`.
 */
export const lightDomKitStyles = kitStyles.replace(/^(\s*)([^@\s{}][^{}]*?) \{$/gm, (line, indent: string, list: string) => {
  if (!list.includes('.kdl-ui-')) return line;
  const boosted = splitSelectors(list).map((sel) =>
    sel.startsWith('.kdl-ui-') ? sel.replace(/^\.[\w-]+/, (cls) => cls + IN_SCOPE) : sel
  );
  return `${indent}${boosted.join(', ')} {`;
});
