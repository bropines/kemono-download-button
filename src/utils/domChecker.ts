import { debugModule } from './logger';

/**
 * DOM Checker & Cleanup Guardian.
 * Scans the DOM for duplicate components and orphan elements,
 * purges extra copies, and logs diagnostic info.
 */
export function sanitizeDuplicates(): void {
  // 1. Sanitize Duplicate Image Gallery Layouts
  const galleryLayouts = document.querySelectorAll('.kui-gallery-layout');
  if (galleryLayouts.length > 1) {
    debugModule.update({ warn: `Found ${galleryLayouts.length} duplicate .kui-gallery-layout elements. Purging...` });
    for (let i = 0; i < galleryLayouts.length - 1; i++) {
      galleryLayouts[i].remove();
    }
  }

  // 2. Sanitize Duplicate Video Gallery Layouts
  const videoLayouts = document.querySelectorAll('.kui-video-gallery-layout');
  if (videoLayouts.length > 1) {
    debugModule.update({ warn: `Found ${videoLayouts.length} duplicate .kui-video-gallery-layout elements. Purging...` });
    for (let i = 0; i < videoLayouts.length - 1; i++) {
      videoLayouts[i].remove();
    }
  }

  // 3. Sanitize Duplicate Embed Containers inside post content
  const embedContainers = document.querySelectorAll('.kui-embed-container');
  if (embedContainers.length > 1) {
    debugModule.update({ warn: `Found ${embedContainers.length} duplicate .kui-embed-container elements. Purging...` });
    for (let i = 0; i < embedContainers.length - 1; i++) {
      embedContainers[i].remove();
    }
  }

  // 4. Sanitize Orphan Thumbnail Wrappers
  document.querySelectorAll('.kui-thumb-wrapper').forEach((wrapper) => {
    if (!wrapper.closest('.kui-gallery-layout')) {
      wrapper.remove();
    }
  });

  // 5. Sanitize Duplicate Settings Panels
  const settingsPanels = document.querySelectorAll('#kui-settings-panel');
  if (settingsPanels.length > 1) {
    for (let i = 0; i < settingsPanels.length - 1; i++) {
      settingsPanels[i].remove();
    }
  }
}
