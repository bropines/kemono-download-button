// Plyr's control labels in the interface language. Plyr fills its own {seektime}/{title}/{currentTime}
// placeholders, so these are passed through t() without params (which leaves braces alone).
import { t } from './index';

export function plyrI18n(): Record<string, string> {
  return {
    restart: t('common.plyr.restart'),
    rewind: t('common.plyr.rewind'),
    play: t('common.plyr.play'),
    pause: t('common.plyr.pause'),
    fastForward: t('common.plyr.fastForward'),
    seek: t('common.plyr.seek'),
    seekLabel: t('common.plyr.seekLabel'),
    played: t('common.plyr.played'),
    buffered: t('common.plyr.buffered'),
    currentTime: t('common.plyr.currentTime'),
    duration: t('common.plyr.duration'),
    volume: t('common.plyr.volume'),
    mute: t('common.plyr.mute'),
    unmute: t('common.plyr.unmute'),
    enableCaptions: t('common.plyr.enableCaptions'),
    disableCaptions: t('common.plyr.disableCaptions'),
    download: t('common.plyr.download'),
    enterFullscreen: t('common.plyr.enterFullscreen'),
    exitFullscreen: t('common.plyr.exitFullscreen'),
    frameTitle: t('common.plyr.frameTitle'),
    captions: t('common.plyr.captions'),
    settings: t('common.plyr.settings'),
    pip: t('common.plyr.pip'),
    menuBack: t('common.plyr.menuBack'),
    speed: t('common.plyr.speed'),
    normal: t('common.plyr.normal'),
    quality: t('common.plyr.quality'),
    loop: t('common.plyr.loop'),
    start: t('common.plyr.start'),
    end: t('common.plyr.end'),
    all: t('common.plyr.all'),
    reset: t('common.plyr.reset'),
    disabled: t('common.plyr.disabled'),
    enabled: t('common.plyr.enabled'),
  };
}
