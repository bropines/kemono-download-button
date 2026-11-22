import { el } from '../../utils/dom';
import {
  badge,
  button,
  card,
  checkbox,
  dialog,
  emptyState,
  ensureKit,
  field,
  input,
  kbd,
  popover,
  progress,
  scrollArea,
  select,
  separator,
  setButtonLoading,
  setFieldError,
  setKitTheme,
  setProgress,
  sheet,
  skeleton,
  slider,
  switchControl,
  tabs,
  textarea,
  toast,
  tooltip,
  type ButtonVariant,
  type Child,
} from './index';

const section = (title: string, children: Child[]) =>
  el('section', { className: 'kdl-ui-stack', style: { gap: '12px' } }, [
    el('h3', { className: 'kdl-ui-muted', textContent: title, style: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' } }),
    ...children,
  ]);
const row = (children: Child[]) => el('div', { className: 'kdl-ui-row' }, children);

function buttonsSection(): HTMLElement {
  const variants: ButtonVariant[] = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];
  const loadingBtn = button({
    label: 'Click to load',
    icon: 'download',
    onClick: () => {
      setButtonLoading(loadingBtn, true);
      setTimeout(() => setButtonLoading(loadingBtn, false), 1500);
    },
  });
  return section('Button', [
    row(variants.map((variant) => button({ label: variant, variant }))),
    row([
      button({ label: 'Small', size: 'sm', variant: 'outline' }),
      button({ label: 'Default', variant: 'outline' }),
      button({ label: 'Large', size: 'lg', variant: 'outline' }),
      tooltip(button({ icon: 'settings', size: 'icon', variant: 'outline', ariaLabel: 'Settings' }), { text: 'Icon button with tooltip' }),
      loadingBtn,
      button({ label: 'Disabled', disabled: true }),
    ]),
  ]);
}

function formSection(): HTMLElement {
  const name = input({ placeholder: 'Folder name' });
  const nameField = field({ label: 'Folder name', description: 'Used for ZIP archives.', control: name });
  name.addEventListener('input', () => setFieldError(nameField, /[\\/:*?"<>|]/.test(name.value) ? 'Contains illegal characters.' : null));
  return section('Form controls', [
    nameField,
    field({ label: 'Notes', control: textarea({ placeholder: 'Type a message…' }) }),
    field({
      label: 'Sort order',
      control: select({ options: [{ value: 'new', label: 'Newest first' }, { value: 'old', label: 'Oldest first' }, 'Random'] }),
    }),
    field({ label: 'Concurrent downloads', control: slider({ min: 1, max: 10, value: 3, showValue: true }) }),
    field({ label: 'Accept terms', description: 'Checkbox row in a horizontal field.', orientation: 'horizontal', control: checkbox({ checked: true }) }),
    field({ label: 'Indeterminate', orientation: 'horizontal', control: checkbox({ indeterminate: true }) }),
    field({ label: 'Auto-translate', orientation: 'horizontal', control: switchControl({ checked: true }) }),
    field({ label: 'Required field', required: true, error: 'This field is required.', control: input({ placeholder: 'Empty' }) }),
  ]);
}

function displaySection(): HTMLElement {
  const bar = progress({ value: 35, ariaLabel: 'Demo progress' });
  let value = 35;
  const timer = window.setInterval(() => {
    if (!bar.isConnected) return clearInterval(timer);
    value = (value + 5) % 105;
    setProgress(bar, value);
  }, 400);
  return section('Display', [
    row(['default', 'secondary', 'outline', 'destructive', 'success', 'warning'].map((v) => badge({ text: v, variant: v as never }))),
    separator(),
    bar,
    progress({ value: null, ariaLabel: 'Indeterminate' }),
    row([skeleton({ width: '120px', height: '14px' }), skeleton({ width: '92px', height: '1.875rem', pill: true })]),
    row(['Press ', kbd(['Ctrl', 'K']), ' to search, ', kbd('Esc'), ' to close.']),
    card({
      title: 'Card title',
      description: 'Card description in muted text.',
      headerAction: badge({ text: 'New', variant: 'secondary' }),
      content: [el('p', { textContent: 'Card content sits on a 24px padding grid.' })],
      footer: [button({ label: 'Cancel', variant: 'outline' }), button({ label: 'Save' })],
    }),
    scrollArea({
      maxHeight: '120px',
      ariaLabel: 'Scrollable list',
      className: 'kdl-ui-card',
      children: Array.from({ length: 20 }, (_, i) => el('div', { textContent: `Item ${i + 1}`, style: { padding: '6px 12px' } })),
    }),
    emptyState({ icon: 'folder-open', title: 'No files', description: 'Nothing to download in this post.', action: button({ label: 'Refresh', variant: 'outline', icon: 'refresh-cw' }) }),
  ]);
}

function overlaysSection(): HTMLElement {
  const popTrigger = button({ label: 'Open popover', variant: 'outline' });
  popover({
    trigger: popTrigger,
    ariaLabel: 'Dimensions',
    content: () => [
      el('div', { className: 'kdl-ui-stack', style: { gap: '12px' } }, [
        el('div', { textContent: 'Dimensions', style: { fontWeight: '600' } }),
        field({ label: 'Width', control: input({ value: '100%' }) }),
        field({ label: 'Height', control: input({ value: '25px' }) }),
      ]),
    ],
  });
  const openSheet = (side: 'left' | 'right' | 'bottom') =>
    sheet({ side, title: `Sheet (${side})`, description: 'Side panel built on the same modal core.', content: [el('p', { textContent: 'Press Escape or click outside to close.' })] }).open();
  return section('Overlays', [
    row([
      popTrigger,
      button({ label: 'Sheet left', variant: 'outline', onClick: () => openSheet('left') }),
      button({ label: 'Sheet right', variant: 'outline', onClick: () => openSheet('right') }),
      button({ label: 'Sheet bottom', variant: 'outline', onClick: () => openSheet('bottom') }),
    ]),
    row([
      button({ label: 'Toast', variant: 'secondary', onClick: () => toast({ title: 'Saved', description: 'Settings were saved.' }) }),
      button({ label: 'Success', variant: 'secondary', onClick: () => toast({ title: 'Download finished', variant: 'success' }) }),
      button({ label: 'Error', variant: 'secondary', onClick: () => toast({ title: 'Request failed', description: 'HTTP 429, retrying later.', variant: 'destructive' }) }),
      button({
        label: 'Loading → done',
        variant: 'secondary',
        onClick: () => {
          const t = toast({ title: 'Zipping…', variant: 'loading' });
          setTimeout(() => t.update({ title: 'Archive ready', variant: 'success', duration: 3000 }), 1500);
        },
      }),
      button({ label: 'With action', variant: 'secondary', onClick: () => toast({ title: 'Post hidden', action: { label: 'Undo', onClick: () => toast({ title: 'Restored' }) } }) }),
    ]),
  ]);
}

/** Opens a dialog showing every kit primitive. Not wired into the app; call it from the console or a test hook. */
export function openKitDemo(): void {
  ensureKit();
  let light = false;
  const themeBtn = button({
    label: 'Toggle theme',
    variant: 'outline',
    size: 'sm',
    icon: 'eye',
    onClick: () => setKitTheme((light = !light) ? 'light' : 'dark'),
  });
  const demo = dialog({
    title: 'UI kit',
    description: 'Every primitive in src/ui/kit, rendered in the kit shadow root.',
    size: 'lg',
    content: () => [
      tabs({
        ariaLabel: 'Demo sections',
        items: [
          { value: 'buttons', label: 'Buttons', content: () => buttonsSection() },
          { value: 'forms', label: 'Forms', content: () => formSection() },
          { value: 'display', label: 'Display', content: () => displaySection() },
          { value: 'overlays', label: 'Overlays', content: () => overlaysSection() },
          { value: 'disabled', label: 'Disabled', content: [], disabled: true },
        ],
      }),
    ],
    footer: [themeBtn, button({ label: 'Close', onClick: () => demo.close() })],
  });
  demo.open();
}
