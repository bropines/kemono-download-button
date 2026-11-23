// Settings files: the Export dialog (full backup, without secrets, the "for AI" packs), the Import flow (detects
// the file type, confirms a restore with a summary) and the "Copy for AI / Import AI answer" row that sits next
// to each area's own settings.

import { exportBackup, applyBackup, inspectImport, type ImportPlan } from '../../state/store';
import { AiPackError, aiPackText, applyAiPack, buildAiPack, getAiPacks, parseAiAnswer, type AiApplyResult, type AiPackDef } from '../../state/aiPack';
import '../../state/aiPacks';
import { importThemesJson } from '../../modules/restyle/store';
import { copyToClipboard } from '../../utils/clipboard';
import { saveBlob } from '../../utils/saveFile';
import { scriptVersion } from '../../utils/version';
import { el } from '../../utils/dom';
import { button, dialog, kitIcon, textarea, toast, type DialogHandle } from '../kit';
import { showMessage } from '../toast';
import { t } from '../../i18n';
import { refreshSettings } from './dialog';

const MAX_LISTED_KEYS = 8;

function pickFile(onText: (text: string) => void): void {
  const input = el('input', { type: 'file', accept: '.json,application/json,.txt,text/plain', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.remove();
    if (file) onText(await file.text());
  });
  document.body.append(input);
  input.click();
}

/** An error as the user reads it: AI pack problems are worded through ai.error.<code> */
const errorText = (error: unknown): string =>
  error instanceof AiPackError ? t(`ai.error.${error.code}`, error.params) : (error as Error).message;

const listKeys = (keys: string[]): string =>
  keys.slice(0, MAX_LISTED_KEYS).join(', ') + (keys.length > MAX_LISTED_KEYS ? ', …' : '');

function reportSkipped(title: string, applied: number, skipped: string[]): void {
  toast({
    title,
    description: skipped.length ? t('settings.import.skipped', { count: skipped.length, keys: listKeys(skipped) }) : undefined,
    variant: !applied ? 'warning' : skipped.length ? 'default' : 'success',
    duration: skipped.length ? 8000 : undefined,
  });
}

function reportAi(result: AiApplyResult): void {
  const title = result.pack.title();
  reportSkipped(result.applied.length ? t('ai.import.done', { title, count: result.applied.length }) : t('ai.import.nothing', { title }), result.applied.length, result.skipped);
  if (result.applied.length) refreshSettings();
}

// ---- AI packs ------------------------------------------------------------------------------------

export async function copyAiPack(pack: AiPackDef): Promise<void> {
  if (await copyToClipboard(aiPackText(pack, scriptVersion()))) showMessage(t('ai.copied'), 'success');
  else showMessage(t('ai.copyFailed'), 'error');
}

export function saveAiPack(pack: AiPackDef): void {
  const json = JSON.stringify(buildAiPack(pack, scriptVersion()), null, 2);
  saveBlob(new Blob([json], { type: 'application/json;charset=utf-8' }), `kemono-downloader-ai-${pack.id}.json`, true);
}

/** Paste box (or file) for an AI answer. With `pack`, only that pack is accepted; without, the answer names it. */
export function openAiImport(pack?: AiPackDef): void {
  const box = textarea({ rows: 10, placeholder: t('ai.import.placeholder'), ariaLabel: t('ai.import.placeholder'), className: 'kdl-transfer__paste' });
  const apply = async (text: string): Promise<void> => {
    if (!text.trim()) return void showMessage(t('ai.import.empty'), 'warning');
    try {
      const result = await applyAiPack(parseAiAnswer(text), pack);
      handle.close();
      reportAi(result);
    } catch (error) {
      showMessage(t('ai.import.failed', { error: errorText(error) }), 'error');
    }
  };
  const handle: DialogHandle = dialog({
    title: pack ? t('ai.import.titleFor', { title: pack.title() }) : t('ai.import.title'),
    description: pack ? t('ai.import.descriptionFor', { title: pack.title() }) : t('ai.import.description'),
    size: 'md',
    className: 'kdl-transfer',
    content: () => [box],
    footer: [
      button({ label: t('ai.import.file'), icon: 'folder-open', variant: 'outline', onClick: () => pickFile((text) => { box.value = text; void apply(text); }) }),
      el('span', { className: 'kdl-settings__footer-spacer' }),
      button({ label: t('settings.common.cancel'), variant: 'outline', onClick: () => handle.close() }),
      button({ label: t('ai.import.apply'), icon: 'check', onClick: () => void apply(box.value) }),
    ],
    initialFocus: box,
  });
  handle.open();
}

/** "Ask an AI" row for an area's settings: copy the pack, save it as a file, import the answer */
export function aiPackActions(pack: AiPackDef): HTMLElement {
  return el('div', { className: 'kdl-transfer__ai', dataset: { aiPack: pack.id } }, [
    el('div', { className: 'kdl-transfer__ai-text' }, [
      el('span', { className: 'kdl-transfer__ai-title' }, [kitIcon('sparkles'), t('ai.actions.title')]),
      el('span', { className: 'kdl-transfer__ai-hint', textContent: t('ai.actions.hint') }),
    ]),
    el('div', { className: 'kdl-transfer__ai-buttons' }, [
      button({ label: t('ai.copy'), icon: 'copy', variant: 'secondary', size: 'sm', onClick: () => void copyAiPack(pack) }),
      button({ icon: 'download', variant: 'outline', size: 'icon', ariaLabel: t('ai.save'), title: t('ai.save'), onClick: () => saveAiPack(pack) }),
      button({ label: t('ai.import'), icon: 'folder-open', variant: 'outline', size: 'sm', onClick: () => openAiImport(pack) }),
    ]),
  ]);
}

// ---- Export --------------------------------------------------------------------------------------

function exportOption(id: string, icon: 'lock' | 'share-2', label: string, hint: string, onClick: () => void): HTMLElement {
  return el('button', { type: 'button', id, className: 'kdl-transfer__option', onclick: onClick }, [
    kitIcon(icon),
    el('span', { className: 'kdl-transfer__option-text' }, [
      el('span', { className: 'kdl-transfer__option-label', textContent: label }),
      el('span', { className: 'kdl-transfer__option-hint', textContent: hint }),
    ]),
    kitIcon('download'),
  ]);
}

function packRow(pack: AiPackDef): HTMLElement {
  return el('div', { className: 'kdl-transfer__pack', dataset: { aiPack: pack.id } }, [
    el('span', { className: 'kdl-transfer__pack-title', textContent: pack.title() }),
    button({ icon: 'copy', variant: 'ghost', size: 'icon', ariaLabel: `${t('ai.copy')}: ${pack.title()}`, title: t('ai.copy'), onClick: () => void copyAiPack(pack) }),
    button({ icon: 'download', variant: 'ghost', size: 'icon', ariaLabel: `${t('ai.save')}: ${pack.title()}`, title: t('ai.save'), onClick: () => saveAiPack(pack) }),
  ]);
}

export function openExportDialog(): void {
  const handle: DialogHandle = dialog({
    title: t('settings.export.title'),
    description: t('settings.export.description'),
    size: 'md',
    className: 'kdl-transfer',
    content: () => [
      el('h4', { className: 'kdl-transfer__heading', textContent: t('settings.export.backupSection') }),
      exportOption('kdl-export-full', 'lock', t('settings.export.full'), t('settings.export.fullHint'), () => { handle.close(); void exportBackup('full'); }),
      exportOption('kdl-export-safe', 'share-2', t('settings.export.safe'), t('settings.export.safeHint'), () => { handle.close(); void exportBackup('safe'); }),
      el('h4', { className: 'kdl-transfer__heading', textContent: t('settings.export.aiSection') }),
      el('p', { className: 'kdl-transfer__hint', textContent: t('settings.export.aiHint') }),
      el('div', { className: 'kdl-transfer__packs' }, getAiPacks().map(packRow)),
    ],
    footer: [
      button({ label: t('ai.import'), icon: 'sparkles', variant: 'outline', onClick: () => { handle.close(); openAiImport(); } }),
      el('span', { className: 'kdl-settings__footer-spacer' }),
      button({ label: t('settings.footer.done'), onClick: () => handle.close() }),
    ],
  });
  handle.open();
}

// ---- Import --------------------------------------------------------------------------------------

function confirmRestore(plan: ImportPlan): void {
  const kindLabel = plan.kind === 'full' ? t('settings.restore.full') : plan.kind === 'safe' ? t('settings.restore.safe') : t('settings.restore.legacy');
  const date = plan.exportedAt && !Number.isNaN(Date.parse(plan.exportedAt)) ? new Date(plan.exportedAt).toLocaleString() : '';
  const lines = [
    t('settings.restore.count', { count: plan.known }),
    plan.script || date ? t('settings.restore.from', { version: plan.script || '?', date: date || '?' }) : '',
    plan.secrets ? t('settings.restore.secrets', { count: plan.secrets }) : t('settings.restore.keepsSecrets'),
    t('settings.restore.replace'),
  ].filter(Boolean);
  const handle: DialogHandle = dialog({
    title: t('settings.restore.title'),
    description: kindLabel,
    size: 'sm',
    className: 'kdl-transfer',
    content: () => [el('ul', { className: 'kdl-transfer__summary' }, lines.map((line, i) =>
      el('li', { className: i === 2 && plan.secrets ? 'kdl-transfer__summary-warn' : '', textContent: line })))],
    footer: [
      button({ label: t('settings.common.cancel'), variant: 'outline', onClick: () => handle.close() }),
      button({
        id: 'kdl-restore-confirm',
        label: t('settings.restore.confirm'),
        onClick: async () => {
          handle.close();
          try {
            const { applied, skipped } = await applyBackup(plan);
            refreshSettings();
            reportSkipped(t('settings.import.done', { count: applied.length }), applied.length, skipped);
          } catch (error) {
            showMessage(t('settings.import.failed', { error: errorText(error) }), 'error');
          }
        },
      }),
    ],
  });
  handle.open();
}

/** Import button: reads a file, works out what it is and applies it (a restore after a confirmation) */
export function importSettingsFile(): void {
  pickFile(async (text) => {
    try {
      const plan = inspectImport(text);
      if (plan.kind === 'ai') return reportAi(await applyAiPack(plan.data));
      if (plan.kind === 'theme') {
        const imported = importThemesJson(text);
        toast({ title: t('themes.import.done', { count: imported.length }), description: t('themes.import.disabled'), variant: 'success' });
        return refreshSettings();
      }
      confirmRestore(plan);
    } catch (error) {
      showMessage(t('settings.import.failed', { error: errorText(error) }), 'error');
    }
  });
}
