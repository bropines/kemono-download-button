import { t } from '../../i18n';
import { css } from '../../utils/cssBuilder';
import { isPawchiveFile } from '../../utils/pawchiveRateLimit';
import { addKitStyles, button, dialog, scrollArea } from '../kit';

export interface DirectDownloadFile { url: string; fileName: string }

const styles = css({
  '.kdl-direct-download-list': { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh' },
  '.kdl-direct-download-link.kdl-ui-btn': { width: '100%', height: 'auto', minHeight: '44px', justifyContent: 'flex-start', whiteSpace: 'normal', overflowWrap: 'anywhere', textAlign: 'left' },
});

/** Offer real links, never pretend that starting the browser download means it succeeded. */
export function showDirectDownloadFallback(files: DirectDownloadFile[]): void {
  const valid = files.filter((file) => isPawchiveFile(file.url));
  if (!valid.length) return;
  addKitStyles('kdl-direct-download-styles', styles);
  const links = valid.map(({ url, fileName }) => button({
    href: url,
    target: '_blank',
    download: fileName.split('/').pop() || fileName,
    label: fileName.split('/').pop() || fileName,
    icon: 'download',
    variant: 'outline',
    className: 'kdl-direct-download-link',
  }));
  const handle = dialog({
    title: t('dl.direct.title'),
    description: t('dl.direct.description'),
    content: [scrollArea({ className: 'kdl-direct-download-list', ariaLabel: t('dl.direct.files'), children: links })],
  });
  handle.open();
}
