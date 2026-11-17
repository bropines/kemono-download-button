import { KUI_STORAGE_KEYS } from '../../../config/storage';
import { isAdBlockEnabled, setAdBlockEnabled } from '../../../features/adblock';
import { hideEmptySections } from '../../../features/kui/embeds';
import { postPageModule } from '../../../features/kui/postPageModule';
import { clearViewedPosts, getViewedPostsCount } from '../../../features/kui/viewedPosts';
import { readStored, writeStored } from '../../../state/gmStorage';
import { kuiState, setEmbedRules, setHideEmptySections, setPreloadImages } from '../../../state/kuiState';
import type { EmbedRules } from '../../../types';
import { el } from '../../../utils/dom';
import { badge, button, field, input, kitIcon, select, slider } from '../../kit';
import { getModuleSetting, setModuleSetting } from '../../../core/registry';
import { showMessage } from '../../toast';
import { grid, notifySaved, section, settingSwitch, switchRow } from '../controls';
import { registerSettingsSection } from '../registry';

const GRID_MIN = 120;
const GRID_MAX = 400;

function gridSizeField(): HTMLElement {
  const saved = Math.max(GRID_MIN, Math.min(GRID_MAX, Number(getModuleSetting<number>('gridSize', 'size')) || 180));
  const control = slider({
    id: 'gridSizeSlider',
    min: GRID_MIN,
    max: GRID_MAX,
    step: 10,
    value: saved,
    showValue: (v) => `${v}px`,
    // The gridSize module applies the size to the page as soon as its setting changes
    onInput: (value) => setModuleSetting('gridSize', 'size', value),
    onChange: () => notifySaved(),
  });
  return field({ label: 'Post card size', description: 'Width of post cards in post lists.', control });
}

function embedRulesField(): HTMLElement {
  const rules: EmbedRules = { ...kuiState.embedRules };
  const tags = el('div', { className: 'kdl-settings__chips', id: 'kui-rules-container' });
  const commit = () => {
    setEmbedRules({ ...rules });
    render();
    notifySaved();
    if (kuiState.isPostPageModuleActive) postPageModule.refreshContent();
  };
  const render = () => {
    tags.replaceChildren(
      ...Object.entries(rules).map(([domain, action]) => {
        const toggle = el('button', {
          type: 'button',
          className: 'kdl-settings__chip-toggle',
          title: 'Switch between button and hide',
          textContent: action === 'button' ? 'Button' : 'Hide',
          onClick: () => {
            rules[domain] = rules[domain] === 'button' ? 'hide' : 'button';
            commit();
          },
        });
        const remove = el('button', {
          type: 'button',
          className: 'kdl-settings__chip-remove',
          onClick: () => {
            delete rules[domain];
            commit();
          },
        }, [kitIcon('x')]);
        remove.setAttribute('aria-label', `Remove rule for ${domain}`);
        const chip = badge({ text: '', variant: 'secondary', className: 'kdl-settings__chip' });
        chip.replaceChildren(toggle, `: ${domain}`, remove);
        return chip;
      })
    );
  };
  const domainInput = input({ id: 'kui-rule-domain-input', placeholder: 'e.g. *.mega.nz', ariaLabel: 'Domain' });
  const actionSelect = select({
    id: 'kui-rule-action-select',
    ariaLabel: 'Action',
    options: [
      { value: 'button', label: 'Convert to button' },
      { value: 'hide', label: 'Hide link' },
    ],
  });
  const add = () => {
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) return;
    rules[domain] = actionSelect.value;
    domainInput.value = '';
    commit();
  };
  domainInput.addEventListener('keydown', (e) => e.key === 'Enter' && add());
  render();
  return field({
    label: 'Embed link rules',
    description: 'Links to matching domains in post content become buttons or are hidden. Click a rule’s action to switch it.',
    control: el('div', { className: 'kdl-settings__group' }, [
      el('div', { className: 'kdl-settings__row' }, [
        domainInput,
        actionSelect,
        button({ id: 'kui-add-rule-btn', label: 'Add', icon: 'check', variant: 'secondary', onClick: add }),
      ]),
      tags,
    ]),
  });
}

function viewedPostsRow(): HTMLElement {
  const stat = el('span', { className: 'kdl-settings__stat' });
  const update = () => (stat.textContent = `Viewed posts remembered: ${getViewedPostsCount()}`);
  update();
  return el('div', { className: 'kdl-settings__row' }, [
    stat,
    el('span', { className: 'kdl-settings__footer-spacer' }),
    button({
      label: 'Clear history',
      icon: 'x',
      variant: 'outline',
      size: 'sm',
      onClick: () => {
        clearViewedPosts();
        update();
        showMessage('Viewed posts history cleared', 'success');
      },
    }),
  ]);
}

registerSettingsSection({
  id: 'interface',
  title: 'Interface',
  icon: 'layout-grid',
  order: 50,
  render(container) {
    container.append(
      section('Post lists', [
        gridSizeField(),
        el('p', { className: 'kdl-settings__note', textContent: 'Posts you opened are dimmed in lists.' }),
        viewedPostsRow(),
      ], { icon: 'layout-grid' }),
      section('Post pages', [
        switchRow({
          id: 'hideEmptySectionsToggle',
          label: 'Hide empty post sections',
          description: 'Hides sections like Content or Comments when they have no text, links or comments.',
          checked: kuiState.isHideEmptySectionsEnabled,
          onChange: (checked) => {
            setHideEmptySections(checked);
            hideEmptySections();
            notifySaved();
          },
        }),
        switchRow({
          id: 'preloadImagesToggle',
          label: 'Preload gallery images',
          description: 'Loads every image of a post in the background when its gallery opens. Can use a lot of traffic.',
          checked: kuiState.isPreloadEnabled,
          onChange: (checked) => {
            setPreloadImages(checked);
            notifySaved();
          },
        }),
        embedRulesField(),
      ], { icon: 'file' }),
      section('Site', [
        switchRow({
          id: 'hideAdsToggle',
          label: 'Hide site ads',
          description: 'Hides banner, native and interstitial ad slots, and keeps the Pawchive popunder from loading on later page loads.',
          checked: isAdBlockEnabled(),
          onChange: (checked) => {
            setAdBlockEnabled(checked);
            notifySaved();
          },
        }),
      ], { icon: 'eye' }),
      section('Visible buttons', [
        grid([
          settingSwitch('showZipButton', 'ZIP download'),
          settingSwitch('showImagesButton', 'Images'),
          settingSwitch('showFilesButton', 'Attachments'),
          settingSwitch('showCopyLinksButton', 'Copy links'),
          settingSwitch('showShareButton', 'Share links'),
          settingSwitch('showTranslateButton', 'Translate', 'Title, content and comments.'),
        ]),
      ], { icon: 'sliders-horizontal' })
    );
  },
});
