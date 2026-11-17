// The English baseline: the source of truth for every UI string. Translations (locales/<code>.json,
// section "ui") use the same keys; a key missing there falls back to the text here.
//
// Each area keeps its own file so parallel work does not collide. A key must be unique across files.
import common from './common';
import settings from './settings';
import modules from './modules';
import downloader from './downloader';
import kui from './kui';

export const en = {
  ...common,
  ...settings,
  ...modules,
  ...downloader,
  ...kui,
} as const;

export type UiKey = keyof typeof en;
