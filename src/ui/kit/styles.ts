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

/** Every kit rule, tokens and reset first so component rules win at equal specificity. */
export const kitStyles = [
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
].join('\n');
