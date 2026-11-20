import { isModuleEnabled, setModuleEnabled } from '../../../core';
import {
  availableLanguages,
  getLanguageSetting,
  resolveLanguage,
  setLanguageSetting,
  t,
} from '../../../i18n';
import { getUpdateStatus, packSource, updateTranslations } from '../../../i18n/packs';
import { el } from '../../../utils/dom';
import { button, field, select, setButtonLoading, setSwitch } from '../../kit';
import { showMessage } from '../../toast';
import { notifySaved, section, switchRow, whileConnected } from '../controls';

const SITE_MODULE = 'i18n.site';

const languageName = (code: string) => availableLanguages().find((l) => l.code === code)?.name ?? code;

function statusLines(): string[] {
  const code = resolveLanguage();
  const lines: string[] = [];
  if (code === 'en') lines.push(t('common.lang.status.english'));
  else {
    const local = packSource(code);
    const name = languageName(code);
    if (!local) lines.push(t('common.lang.status.missing', { name }));
    else lines.push(t(local.source === 'downloaded' ? 'common.lang.status.downloaded' : 'common.lang.status.bundled', { name, version: local.pack.version }));
  }
  const status = getUpdateStatus();
  if (!status) lines.push(t('common.lang.status.never'));
  else {
    lines.push(t('common.lang.status.checked', { time: new Date(status.checkedAt).toLocaleString() }));
    if (status.result === 'rejected') lines.push(t('common.lang.status.rejected', { error: status.message ?? '' }));
    else if (status.result === 'updated' && status.dropped) lines.push(t('common.lang.status.dropped', { count: status.dropped }));
    else if (status.result === 'failed') lines.push(t('common.lang.status.failed', { error: status.message ?? '' }));
  }
  return lines;
}

/** Language select, site translation switch and the translation updater, for the General tab. */
export function languageSection(): HTMLElement {
  const detected = languageName(resolveLanguage('auto'));
  const languages = select({
    id: 'kdl-setting-language',
    value: getLanguageSetting(),
    options: [
      { value: 'auto', label: t('common.lang.auto', { name: detected }) },
      ...availableLanguages().map((l) => ({ value: l.code, label: l.name })),
    ],
    // The dialog is rebuilt in the new language by the language runtime (src/i18n/live.ts)
    onChange: (value) => {
      setLanguageSetting(value);
      notifySaved();
      // A language picked from the index has no local pack yet: fetch it now
      void updateTranslations();
    },
  });

  const site = switchRow({
    id: 'kdl-setting-translateSite',
    label: t('common.lang.site.label'),
    description: t('common.lang.site.description'),
    checked: isModuleEnabled(SITE_MODULE),
    onChange: (checked) => {
      setModuleEnabled(SITE_MODULE, checked);
      notifySaved();
    },
  });
  whileConnected(site, (event) => {
    if ((event.type === 'enabled' || event.type === 'disabled') && event.id === SITE_MODULE) {
      setSwitch(site.querySelector<HTMLElement>('[role="switch"]')!, event.type === 'enabled');
    }
  });

  const status = el('div', { className: 'kdl-settings__stat', id: 'kdl-translations-status' });
  const renderStatus = () => status.replaceChildren(...statusLines().map((line) => el('div', { textContent: line })));
  renderStatus();

  const update: HTMLButtonElement = button({
    id: 'kdl-update-translations-btn',
    label: t('common.lang.update'),
    icon: 'refresh-cw',
    variant: 'outline',
    size: 'sm',
    onClick: async () => {
      setButtonLoading(update, true);
      try {
        const result = await updateTranslations(true);
        if (result.result === 'updated') showMessage(t('common.lang.result.updated'), 'success');
        else if (result.result === 'rejected') showMessage(t('common.lang.result.rejected', { error: result.message ?? '' }), 'error');
        else if (result.result === 'failed') showMessage(t('common.lang.result.failed', { error: result.message ?? '' }), 'error');
        else showMessage(t('common.lang.result.current'), 'info');
      } finally {
        if (update.isConnected) {
          setButtonLoading(update, false);
          renderStatus();
        }
      }
    },
  });

  return section(
    t('common.lang.section'),
    [
      field({ label: t('common.lang.label'), description: t('common.lang.description'), control: languages }),
      site,
      el('div', { className: 'kdl-settings__row' }, [status, el('span', { className: 'kdl-settings__footer-spacer' }), update]),
    ],
    { icon: 'languages' }
  );
}
