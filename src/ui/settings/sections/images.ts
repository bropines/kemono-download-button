import { clearImageTranslationCache } from '../../../services/lensImages';
import { el } from '../../../utils/dom';
import { button, setButtonLoading } from '../../kit';
import { showMessage } from '../../toast';
import { section, settingSwitch } from '../controls';
import { registerSettingsSection } from '../registry';

registerSettingsSection({
  id: 'images',
  title: 'Images',
  icon: 'image',
  order: 40,
  render(container) {
    const clear: HTMLButtonElement = button({
      id: 'kdl-clear-lens-cache-btn',
      label: 'Clear image translation cache',
      variant: 'outline',
      onClick: async () => {
        setButtonLoading(clear, true);
        try {
          const { entries } = await clearImageTranslationCache();
          showMessage(entries ? `Forgot ${entries} image translation${entries === 1 ? '' : 's'}` : 'Image translation cache cleared', 'success');
        } finally {
          setButtonLoading(clear, false);
        }
      },
    });
    container.append(
      section('Image translation (Google Lens)', [
        settingSwitch(
          'showImageTranslateButton',
          'Show the Translate button on post images',
          'Translates text drawn inside an image, in the gallery and the lightbox. Needs no key; uses the target language from the Translation tab.'
        ),
        settingSwitch(
          'imageTranslatePersist',
          'Remember across reloads',
          'Recognises a picture by its pixels, so reopening a post asks Lens nothing. Kept by this browser, per site.'
        ),
        el('p', {
          className: 'kdl-settings__note',
          textContent:
            'Display settings (manga mode, erasing, outline, spacing…) live in the image viewer: open an image and press the sliders button next to Translate.',
        }),
        el('div', { className: 'kdl-settings__row' }, [clear]),
      ], { icon: 'image' })
    );
  },
});
