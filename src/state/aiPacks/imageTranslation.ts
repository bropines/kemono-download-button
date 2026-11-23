// Image translation display: how the Lens engine draws translated text over a picture (the lightbox's
// "Translation display" panel).

import { DEFAULT_SETTINGS } from '../../config/constants';
import { t } from '../../i18n';
import { composeAiPrompt, registerAiPack } from '../aiPack';
import { SETTING_RANGES } from '../settingsSchema';
import { fieldDoc, settingField } from './fields';

const D = DEFAULT_SETTINGS;
const range = (key: keyof typeof SETTING_RANGES): string => {
  const [min, max] = SETTING_RANGES[key]!;
  return `Number from ${min} to ${max}.`;
};

const FIELDS = [
  'imageTranslateReflow', 'imageTranslateAlign', 'imageTranslateLineSpacing', 'imageTranslateFitToBox',
  'imageTranslateManga', 'imageTranslateMangaGrowth', 'imageTranslateVertical', 'imageTranslateDrawBackground',
  'imageTranslateErase', 'imageTranslateHullPadding', 'imageTranslateFont', 'imageTranslateOutline',
  'imageTranslateMinPx', 'imageTranslateSharpness',
] as const;

function prompt(): string {
  return composeAiPrompt(imageTranslationPack, {
    role: 'Your job: tune how translated text is drawn over images (Google Lens detects and translates the text, then the script erases the original and draws the translation) so it looks the way the user describes, e.g. "cleaner manga bubbles" or "bigger, readable text on phone".',
    body: `
## How it works
Lens returns text boxes. Horizontal text is drawn line by line inside the boxes Lens found, unless re-wrapping is on: then each paragraph is laid out again as one text area, and only then do alignment, line spacing and "fit to box" apply. Vertical CJK text is re-wrapped anyway unless it is kept vertical. Manga mode is a preset for comics: it always re-wraps vertical text, covers it instead of patching, lets the paragraph spread into the bubble and raises the minimum size.

## Fields in "settings"
${fieldDoc('imageTranslateReflow', 'boolean: re-wrap horizontal text into paragraphs (needed for align, line spacing and fit to box).', D)}
${fieldDoc('imageTranslateAlign', 'one of "auto", "left", "center", "right": alignment of re-wrapped paragraphs.', D)}
${fieldDoc('imageTranslateLineSpacing', `line height multiplier of re-wrapped paragraphs. ${range('imageTranslateLineSpacing')}`, D)}
${fieldDoc('imageTranslateFitToBox', 'boolean: shrink a paragraph that outgrows the room between its neighbours, down to the minimum size.', D)}
${fieldDoc('imageTranslateManga', 'boolean: manga mode (see above).', D)}
${fieldDoc('imageTranslateMangaGrowth', `manga mode only: how far past the detected text a re-wrapped paragraph may spread (bubble fill). ${range('imageTranslateMangaGrowth')}`, D)}
${fieldDoc('imageTranslateVertical', 'vertical CJK text when manga mode is off: "auto" = vertical only when translating into Chinese, Japanese or Korean, "keep" = always vertical, "horizontal" = always re-wrapped horizontally.', D)}
${fieldDoc('imageTranslateDrawBackground', 'boolean: erase the original text before drawing the translation. Off draws the translation over the original.', D)}
${fieldDoc('imageTranslateErase', 'how to erase: "patch" = Lens\'s own inpainted patches, like Chrome; "hull" = cover the text area with its background colour. Manga mode always covers.', D)}
${fieldDoc('imageTranslateHullPadding', `how far past the text the cover reaches, in line heights (used by "hull" and manga mode). ${range('imageTranslateHullPadding')}`, D)}
${fieldDoc('imageTranslateFont', 'a CSS font-family list, e.g. "Comic Neue, Comic Sans MS, sans-serif"; "" uses the system font. Only fonts installed on the device work.', D)}
${fieldDoc('imageTranslateOutline', `thickness multiplier of the outline in the background colour behind the text; 0 removes it. ${range('imageTranslateOutline')}`, D)}
${fieldDoc('imageTranslateMinPx', `the smallest the text may be on screen, in CSS pixels, when the viewer fits the picture; 0 turns the limit off. Text kept at this size may spill past its bubble. Integer from 0 to 32.`, D)}
${fieldDoc('imageTranslateSharpness', 'render scale of the text layer: 1, 2 or 3 (higher stays crisp when zooming, costs memory).', D)}

## Examples
- "Clean manga bubbles": imageTranslateManga = true, imageTranslateDrawBackground = true, imageTranslateMangaGrowth = 1.6, imageTranslateOutline = 1.5.
- "Readable on a phone": imageTranslateMinPx = 14, imageTranslateReflow = true, imageTranslateFitToBox = false.`,
    example: { imageTranslateManga: true, imageTranslateMangaGrowth: 1.6, imageTranslateMinPx: 14 },
  });
}

export const imageTranslationPack = registerAiPack({
  id: 'imageTranslation',
  order: 50,
  title: () => t('ai.pack.imageTranslation'),
  fields: () => FIELDS.map((key) => key === 'imageTranslateMinPx'
    ? { ...settingField(key), set: (value: unknown) => Number.isInteger(value) && settingField(key).set(value) }
    : settingField(key)),
  systemPrompt: prompt,
});
