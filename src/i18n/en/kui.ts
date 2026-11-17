// English source strings (kui). Keys are namespaced; see src/i18n/README.md.
export default {
  // Userscript manager menu
  'kui.menu.downloadSettings': 'Download settings',
  'kui.menu.uiSettings': 'UI settings',

  // Shared media actions (gallery thumbnails, lightbox)
  'kui.media.downloadOriginal': 'Download original',
  'kui.media.searchLens': 'Search with Google Lens',

  // Image translation (Lens)
  'kui.lens.translateImage': 'Translate the text in this image',
  'kui.lens.translateToggle': 'Translate / show original',
  'kui.lens.showOriginal': 'Show the original',
  'kui.lens.error': 'Lens: {message}',
  'kui.lens.imageLoadFailed': 'Could not load the image',
  'kui.lens.noTranslation': 'Lens read the text but returned no translation (same language?)',
  'kui.lens.noText': 'Lens found no text in this image',

  // Lightbox
  'kui.lightbox.label': 'Image viewer',
  'kui.lightbox.copyLink': 'Copy link to original',
  'kui.lightbox.displaySettings': 'Translation display settings',
  'kui.lightbox.previousImage': 'Previous image',
  'kui.lightbox.nextImage': 'Next image',
  'kui.lightbox.previousHint': 'Previous (←)',
  'kui.lightbox.nextHint': 'Next (→)',
  'kui.lightbox.close': 'Close (Esc)',
  'kui.lightbox.loadFailed': 'Could not load this image',

  // Translation display panel (lightbox)
  'kui.lensPanel.title': 'Translation display',
  'kui.lensPanel.reset': 'Back to defaults',
  'kui.lensPanel.close': 'Close',
  'kui.lensPanel.group.paragraphs': 'Paragraphs',
  'kui.lensPanel.group.manga': 'Manga & vertical text',
  'kui.lensPanel.group.erasing': 'Erasing the original',
  'kui.lensPanel.group.text': 'Text',
  'kui.lensPanel.reflow': 'Re-wrap horizontal text',
  'kui.lensPanel.reflow.hint': 'Lay each paragraph out as one text area instead of repeating the lines Lens found. The settings below need it for horizontal text',
  'kui.lensPanel.align': 'Alignment',
  'kui.lensPanel.align.option.auto': 'Follow the source',
  'kui.lensPanel.align.option.left': 'Left',
  'kui.lensPanel.align.option.center': 'Center',
  'kui.lensPanel.align.option.right': 'Right',
  'kui.lensPanel.lineSpacing': 'Line spacing',
  'kui.lensPanel.fitToBox': 'Keep text out of the next bubble',
  'kui.lensPanel.fitToBox.hint': 'Shrink a paragraph that outgrows the room between its neighbours, down to the minimum size',
  'kui.lensPanel.manga': 'Manga mode',
  'kui.lensPanel.manga.hint': 'Always re-wrap vertical text, cover it instead of patching, widen its room, raise the minimum size',
  'kui.lensPanel.mangaGrowth': 'Bubble fill',
  'kui.lensPanel.mangaGrowth.hint': 'How far past the detected text a re-wrapped paragraph may spread',
  'kui.lensPanel.vertical': 'Vertical CJK text',
  'kui.lensPanel.vertical.hint': 'Manga mode always re-wraps',
  'kui.lensPanel.vertical.option.auto': 'Vertical for CJK targets only',
  'kui.lensPanel.vertical.option.keep': 'Always vertical',
  'kui.lensPanel.vertical.option.horizontal': 'Always horizontal',
  'kui.lensPanel.drawBackground': 'Erase the original text',
  'kui.lensPanel.erase': 'How',
  'kui.lensPanel.erase.hint': 'Manga mode always covers',
  'kui.lensPanel.erase.option.patch': "Lens's patches, like Chrome",
  'kui.lensPanel.erase.option.hull': 'Cover the text area with its background',
  'kui.lensPanel.hullPadding': 'Cover margin',
  'kui.lensPanel.hullPadding.hint': 'How far past the text the cover reaches, in line heights',
  'kui.lensPanel.font': 'Font',
  'kui.lensPanel.font.hint': 'A CSS font family; blank uses the system font',
  'kui.lensPanel.outline': 'Outline',
  'kui.lensPanel.outline.hint': 'Thickens the outline in the background colour behind the text; 0 removes it. Lines drawn without erasing have none',
  'kui.lensPanel.minPx': 'Minimum size',
  'kui.lensPanel.minPx.hint': 'The smallest the text may be on screen when the viewer fits the picture; 0 turns it off. Text kept at this size may spill past its bubble',
  'kui.lensPanel.sharpness': 'Sharpness',
  'kui.lensPanel.sharpness.hint': 'Renders at this multiple of the image size, so zooming in stays crisp',

  // Post gallery and videos
  'kui.gallery.toggleThumbnails': 'Toggle thumbnails',
  'kui.video.togglePlaylist': 'Toggle playlist',
  'kui.video.loopOn': 'Loop video (L)',
  'kui.video.loopOff': 'Stop looping (L)',
  'kui.video.untitled': 'Video {n}',

  // Text translation buttons
  'kui.translate.translate': 'Translate',
  'kui.translate.translating': 'Translating…',
  'kui.translate.showOriginal': 'Show original',
  'kui.translate.failed': 'Translation failed: {message}',
  'kui.translate.error.unsupported': 'Provider {provider} is not supported.',
  'kui.translate.error.deeplKey': 'DeepL API key is missing in settings.',
  'kui.translate.error.geminiKey': 'Gemini API key is missing in settings.',
  'kui.translate.error.openaiUrl': 'OpenAI-compatible base URL is missing in settings.',
  'kui.translate.error.openaiModel': 'Model name is missing in settings.',

  // Comments
  'kui.comments.layout': 'Layout',
  'kui.comments.layout.list': 'List',
  'kui.comments.layout.grid': 'Grid',
  'kui.comments.layout.carousel': 'Carousel',
  'kui.comments.show': 'Show',
  'kui.comments.limitAll': 'All',
  'kui.comments.previous': 'Previous',
  'kui.comments.next': 'Next',
  'kui.comments.collapse': 'Collapse',
  'kui.comments.expand': 'Expand',
  'kui.comments.expandReplies': 'Expand ({count, plural, one{# reply} other{# replies}})',
  'kui.comments.showingThreads': 'Showing {shown} of {count} threads',
  'kui.comments.showingComments': 'Showing {shown} of {count} comments',
  'kui.comments.total': '{count, plural, one{# comment} other{# comments}}',
  'kui.comments.totalInThreads': '{count, plural, one{# comment} other{# comments}} in {threads} threads',
  'kui.comments.showMore': 'Show {count} more ({left} left)',

  // Embedded links
  'kui.embeds.downloadFile': 'Download {name}',
  'kui.embeds.passwordCopied': 'Password copied to clipboard',
  'kui.embeds.passwordCopyFailed': 'Could not copy the password',
  'kui.embeds.passwordTitle': 'Password: {password} (copied on click)',

  // Creator page
  'kui.user.copyNickname': 'Copy nickname',

  // Viewed posts tag on cards
  'kui.viewed.tag': 'Viewed',
} as const;
