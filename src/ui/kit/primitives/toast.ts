import { el } from '../../../utils/dom';
import { t } from '../../../i18n';
import type { IconName } from '../../../config/icons';
import { portal } from '../root';
import { cx, kitIcon } from '../utils';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'loading';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after ms (default 4000, 6000 for destructive); 0 keeps it until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export interface ToastHandle {
  element: HTMLLIElement;
  dismiss: () => void;
  /** Changes text / variant in place, e.g. a "loading" toast turning into "success". */
  update: (options: Partial<ToastOptions>) => void;
}

const MAX_VISIBLE = 4;
const ICONS: Partial<Record<ToastVariant, IconName>> = {
  success: 'check',
  destructive: 'circle-x',
  warning: 'triangle-alert',
  loading: 'loader-circle',
};
let region: HTMLOListElement | null = null;

function getRegion(): HTMLOListElement {
  if (region?.isConnected) return region;
  region = el('ol', { className: 'kdl-ui-toaster' });
  region.setAttribute('aria-label', t('common.notifications'));
  region.setAttribute('data-kdl-dismiss-ignore', '');
  return portal(region);
}

/** Shows a toast in the single kit queue (bottom-right). Newest on top, oldest dropped past MAX_VISIBLE. */
export function toast(options: ToastOptions): ToastHandle {
  const list = getRegion();
  const element = el('li', { className: 'kdl-ui-toast' });
  let current: ToastOptions = { ...options };
  let timer = 0;
  let remaining = 0;
  let startedAt = 0;

  const dismiss = () => {
    clearTimeout(timer);
    if (!element.isConnected) return;
    element.dataset.state = 'closed';
    setTimeout(() => element.remove(), 150);
  };
  const arm = (ms: number) => {
    clearTimeout(timer);
    remaining = ms;
    startedAt = Date.now();
    if (ms > 0) timer = window.setTimeout(dismiss, ms);
  };

  const render = () => {
    const variant = current.variant ?? 'default';
    element.className = cx('kdl-ui-toast', `kdl-ui-toast--${variant}`, current.className);
    element.setAttribute('role', variant === 'destructive' ? 'alert' : 'status');
    element.setAttribute('aria-live', variant === 'destructive' ? 'assertive' : 'polite');
    const iconName = ICONS[variant];
    const closeBtn = el('button', { type: 'button', className: 'kdl-ui-toast__close', onClick: dismiss }, [
      kitIcon('x'),
    ]);
    closeBtn.setAttribute('aria-label', t('common.dismiss'));
    element.replaceChildren(
      ...[
        iconName ? kitIcon(iconName, cx('kdl-ui-toast__icon', variant === 'loading' && 'kdl-ui-spin')) : null,
        el('div', { className: 'kdl-ui-toast__text' }, [
          el('div', { className: 'kdl-ui-toast__title', textContent: current.title }),
          current.description
            ? el('div', { className: 'kdl-ui-toast__description', textContent: current.description })
            : null,
        ]),
        current.action
          ? el('button', {
              type: 'button',
              className: 'kdl-ui-btn kdl-ui-btn--outline kdl-ui-btn--size-sm',
              textContent: current.action.label,
              onClick: () => {
                current.action!.onClick();
                dismiss();
              },
            })
          : null,
        closeBtn,
      ].filter((n): n is NonNullable<typeof n> => !!n)
    );
    const fallback = variant === 'loading' ? 0 : variant === 'destructive' ? 6000 : 4000;
    arm(current.duration ?? fallback);
  };

  element.addEventListener('mouseenter', () => {
    if (!remaining) return;
    clearTimeout(timer);
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
  });
  element.addEventListener('mouseleave', () => remaining && arm(remaining));

  render();
  list.prepend(element);
  Array.from(list.children).slice(MAX_VISIBLE).forEach((old) => old.remove());

  return {
    element,
    dismiss,
    update: (next) => {
      current = { ...current, ...next };
      render();
    },
  };
}

export function dismissAllToasts(): void {
  region?.replaceChildren();
}
