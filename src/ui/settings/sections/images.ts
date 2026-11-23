import { clearImageTranslationCache } from '../../../services/lensImages';
import { el } from '../../../utils/dom';
import { button, setButtonLoading } from '../../kit';
import { showMessage } from '../../toast';
import { section, settingSwitch } from '../controls';
import { registerSettingsSection } from '../registry';
import { aiPackActions } from '../transfer';
import { imageTranslationPack } from '../../../state/aiPacks';
import { t } from '../../../i18n';

registerSettingsSection({
  id: 'images',
  title: 'Images',
  icon: 'image',
  order: 40,
  render(container) {
    const clear: HTMLButtonElement = button({
      id: 'kdl-clear-lens-cache-btn',
      label: t('settings.images.clearCache'),
      variant: 'outline',
      onClick: async () => {
        setButtonLoading(clear, true);
        try {
          const { entries } = await clearImageTranslationCache();
          showMessage(entries ? t('settings.images.forgot', { count: entries }) : t('settings.images.cleared'), 'success');
        } finally {
          setButtonLoading(clear, false);
        }
      },
    });
    container.append(
      section(t('settings.images.section'), [
        settingSwitch(
          'showImageTranslateButton',
          t('settings.images.showButton'),
          t('settings.images.showButtonDescription')
        ),
        settingSwitch(
          'imageTranslatePersist',
          t('settings.images.persist'),
          t('settings.images.persistDescription')
        ),
        el('p', {
          className: 'kdl-settings__note',
          textContent: t('settings.images.note'),
        }),
        el('div', { className: 'kdl-settings__row' }, [clear]),
        aiPackActions(imageTranslationPack),
      ], { icon: 'image' })
    );
  },
});
