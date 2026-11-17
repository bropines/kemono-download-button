import { KUI_STORAGE_KEYS } from '../../../config/storage';
import { isAdBlockEnabled, setAdBlockEnabled } from '../../../features/adblock';
import { hideEmptySections } from '../../../features/kui/embeds';
import { postPageModule } from '../../../features/kui/postPageModule';
import { clearViewedPosts, getViewedPostsCount } from '../../../features/kui/viewedPosts';
import { readStored, writeStored } from '../../../state/gmStorage';
import { kuiState, setEmbedRules, setHideEmptySections, setPreloadImages } from '../../../state/kuiState';
import type { EmbedRules } from '../../../types';
import { el } from '../../../utils/dom';
import { badge, button, field, input, kitIcon, select, setSliderValue, slider } from '../../kit';
import { getModuleSetting, setModuleSetting } from '../../../core/registry';
import { showMessage } from '../../toast';
import { grid, notifySaved, section, settingSwitch, switchRow, whileConnected } from '../controls';
import { registerSettingsSection } from '../registry';
import { t } from '../../../i18n';

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
  // Follows changes made elsewhere (the page's grid panel, the Modules tab, a reset or an import)
  whileConnected(control, (event) => {
    if (event.type === 'setting' && event.id === 'gridSize' && event.key === 'size') setSliderValue(control, Number(event.value));
  });
  return field({ label: t('settings.interface.cardSize'), description: t('settings.interface.cardSizeDescription'), control });
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
          title: t('settings.interface.embed.toggleTitle'),
          textContent: action === 'button' ? t('settings.interface.embed.button') : t('settings.interface.embed.hide'),
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
        remove.setAttribute('aria-label', t('settings.interface.embed.removeRule', { domain }));
        const chip = badge({ text: '', variant: 'secondary', className: 'kdl-settings__chip' });
        chip.replaceChildren(toggle, `: ${domain}`, remove);
        return chip;
      })
    );
  };
  const domainInput = input({ id: 'kui-rule-domain-input', placeholder: t('settings.interface.embed.domainPlaceholder'), ariaLabel: t('settings.interface.embed.domain') });
  const actionSelect = select({
    id: 'kui-rule-action-select',
    ariaLabel: t('settings.interface.embed.action'),
    options: [
      { value: 'button', label: t('settings.interface.embed.toButton') },
      { value: 'hide', label: t('settings.interface.embed.hideLink') },
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
    label: t('settings.interface.embed.label'),
    description: t('settings.interface.embed.description'),
    control: el('div', { className: 'kdl-settings__group' }, [
      el('div', { className: 'kdl-settings__row' }, [
        domainInput,
        actionSelect,
        button({ id: 'kui-add-rule-btn', label: t('settings.interface.embed.add'), icon: 'check', variant: 'secondary', onClick: add }),
      ]),
      tags,
    ]),
  });
}

function viewedPostsRow(): HTMLElement {
  const stat = el('span', { className: 'kdl-settings__stat' });
  const update = () => (stat.textContent = t('settings.interface.viewed.count', { count: getViewedPostsCount() }));
  update();
  return el('div', { className: 'kdl-settings__row' }, [
    stat,
    el('span', { className: 'kdl-settings__footer-spacer' }),
    button({
      label: t('settings.interface.viewed.clear'),
      icon: 'x',
      variant: 'outline',
      size: 'sm',
      onClick: () => {
        clearViewedPosts();
        update();
        showMessage(t('settings.interface.viewed.cleared'), 'success');
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
      section(t('settings.interface.listsSection'), [
        gridSizeField(),
        el('p', { className: 'kdl-settings__note', textContent: t('settings.interface.viewed.note') }),
        viewedPostsRow(),
      ], { icon: 'layout-grid' }),
      section(t('settings.interface.postSection'), [
        switchRow({
          id: 'hideEmptySectionsToggle',
          label: t('settings.interface.hideEmpty'),
          description: t('settings.interface.hideEmptyDescription'),
          checked: kuiState.isHideEmptySectionsEnabled,
          onChange: (checked) => {
            setHideEmptySections(checked);
            hideEmptySections();
            notifySaved();
          },
        }),
        switchRow({
          id: 'preloadImagesToggle',
          label: t('settings.interface.preload'),
          description: t('settings.interface.preloadDescription'),
          checked: kuiState.isPreloadEnabled,
          onChange: (checked) => {
            setPreloadImages(checked);
            notifySaved();
          },
        }),
        embedRulesField(),
      ], { icon: 'file' }),
      section(t('settings.interface.siteSection'), [
        switchRow({
          id: 'hideAdsToggle',
          label: t('settings.interface.hideAds'),
          description: t('settings.interface.hideAdsDescription'),
          checked: isAdBlockEnabled(),
          onChange: (checked) => {
            setAdBlockEnabled(checked);
            notifySaved();
          },
        }),
      ], { icon: 'eye' }),
      section(t('settings.interface.buttonsSection'), [
        grid([
          settingSwitch('showZipButton', t('settings.interface.buttons.zip')),
          settingSwitch('showImagesButton', t('settings.interface.buttons.images')),
          settingSwitch('showFilesButton', t('settings.interface.buttons.files')),
          settingSwitch('showCopyLinksButton', t('settings.interface.buttons.copyLinks')),
          settingSwitch('showShareButton', t('settings.interface.buttons.share')),
          settingSwitch('showTranslateButton', t('settings.interface.buttons.translate'), t('settings.interface.buttons.translateDescription')),
        ]),
      ], { icon: 'sliders-horizontal' })
    );
  },
});
