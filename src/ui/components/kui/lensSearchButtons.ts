import { getLanguage, t } from '../../../i18n';
import { lensSearchUrl } from '../../../services/lensSearch';
import { lensSearchStyles } from '../../../styles/components/lensSearch.styles';
import { el } from '../../../utils/dom';
import { openPendingTab } from '../../../utils/pendingTab';
import { addKitStyles, button, input, popover, setButtonLoading, toast, tooltip } from '../../kit';
import { showMessage } from '../../toast';
import { lensIcon } from './lensIcon';

export interface LensSearchButtonsOptions {
  /** The picture to search for, read when a button is pressed */
  url: () => string;
  /** Where the tooltips and the question popover open */
  side: 'bottom' | 'left';
  /** Element ids, where a place has only one pair of buttons */
  ids?: { search: string; ask: string };
}

export interface LensSearchButtons {
  search: HTMLButtonElement;
  ask: HTMLButtonElement;
  /** The question popover, for a host that handles keys itself */
  askPopover: HTMLElement;
  closeAsk(): void;
}

/** Whether the page is dark, for Google's results to match; undefined when the page does not say */
function pageIsDark(): boolean | undefined {
  const channels = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3 || channels[3] === 0) return undefined;
  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

// The results page exists only after Lens has answered, and a tab opened then is a popup. So the tab is
// opened blank during the click and sent to the address later; where no tab opens (a blocked popup, AdGuard
// on Android) the address is shown as a link for the user to tap. The page itself is never fetched from here.
async function run(btn: HTMLButtonElement, url: string, mode: 'visual' | 'ai', text = ''): Promise<void> {
  if (!url || btn.hasAttribute('data-loading')) return;
  const tab = openPendingTab(t('kui.lensSearch.waiting'));
  setButtonLoading(btn, true);
  try {
    const results = await lensSearchUrl(url, { mode, text, uiLanguage: getLanguage(), dark: pageIsDark() });
    if (!tab.go(results)) {
      toast({ title: t('kui.lensSearch.ready'), link: { label: t('kui.lensSearch.open'), href: results }, duration: 0 });
    }
  } catch (error) {
    tab.cancel();
    showMessage(t('kui.lens.error', { message: error instanceof Error ? error.message : String(error) }), 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

/** "Search by image" and "Ask AI" (Google Lens) for one picture: two icon buttons of the media actions row. */
export function lensSearchButtons(options: LensSearchButtonsOptions): LensSearchButtons {
  addKitStyles('kui-lens-search-styles', lensSearchStyles);
  const iconButton = (id: string | undefined, icon: 'sparkles' | SVGElement, text: string, onClick?: () => void) =>
    tooltip(
      button({ id, icon, variant: 'secondary', size: 'icon', ariaLabel: text, className: 'kui-action-btn', onClick }),
      { text, side: options.side }
    );

  const search = iconButton(options.ids?.search, lensIcon(), t('kui.media.searchLens'), () => void run(search, options.url(), 'visual'));
  const ask = iconButton(options.ids?.ask, 'sparkles', t('kui.lensSearch.ask'));

  const question = input({ placeholder: t('kui.lensSearch.askPlaceholder'), ariaLabel: t('kui.lensSearch.ask'), autocomplete: 'off' });
  const form = el('form', { className: 'kui-lens-ask__form' }, [
    question,
    button({ type: 'submit', label: t('kui.lensSearch.askSubmit'), icon: 'sparkles' }),
  ]);
  const asking = popover({
    trigger: ask,
    content: [form],
    ariaLabel: t('kui.lensSearch.ask'),
    className: 'kui-lens-ask',
    side: options.side,
    align: options.side === 'bottom' ? 'end' : 'start',
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // An empty question is a question too: AI Mode then describes the picture
    void run(ask, options.url(), 'ai', question.value);
    asking.close();
  });
  // Typing a question must not page through the site (it opens the next post on an arrow key)
  form.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') event.stopPropagation();
  });

  return { search, ask, askPopover: asking.element, closeAsk: asking.close };
}
