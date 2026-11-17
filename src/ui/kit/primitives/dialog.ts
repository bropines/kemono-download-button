import { el } from '../../../utils/dom';
import { t } from '../../../i18n';
import { createModal, type ModalOptions } from '../behaviors/modal';
import { cx, kitIcon, resolveContent, uid, type Child, type Content } from '../utils';

export interface DialogOptions extends ModalOptions {
  title: string;
  description?: string;
  content?: Content;
  footer?: Child[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show the top-right close button (default true). */
  showClose?: boolean;
  className?: string;
}

export interface DialogHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  /** The dialog panel (role="dialog"). */
  element: HTMLDivElement;
  /** Scrollable body between header and footer. */
  body: HTMLDivElement;
  /** Footer row (empty when no footer was given). */
  footer: HTMLDivElement;
}

/** Builds the header / body / footer layout shared by dialog and sheet. */
export function buildPanel(
  panel: HTMLDivElement,
  options: { title: string; description?: string; content?: Content; footer?: Child[]; showClose?: boolean },
  close: () => void
): { body: HTMLDivElement; footer: HTMLDivElement } {
  const id = uid('kdl-ui-dialog');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', `${id}-title`);
  const desc = options.description
    ? el('p', { id: `${id}-desc`, className: 'kdl-ui-dialog__description', textContent: options.description })
    : null;
  if (desc) panel.setAttribute('aria-describedby', desc.id);
  const body = el('div', { className: 'kdl-ui-dialog__body' }, options.content ? resolveContent(options.content) : []);
  const footer = el('div', { className: 'kdl-ui-dialog__footer' }, options.footer ?? []);
  if (!options.footer) footer.hidden = true;
  const closeBtn =
    options.showClose === false
      ? null
      : el('button', { type: 'button', className: 'kdl-ui-dialog__close', onClick: close }, [kitIcon('x')]);
  closeBtn?.setAttribute('aria-label', t('common.close'));
  panel.append(
    el('div', { className: 'kdl-ui-dialog__header' }, [
      el('h2', { id: `${id}-title`, className: 'kdl-ui-dialog__title', textContent: options.title }),
      desc,
    ]),
    body,
    footer,
    ...(closeBtn ? [closeBtn] : [])
  );
  return { body, footer };
}

/** Centered modal dialog, mounted in the kit shadow root on open() and removed on close(). */
export function dialog(options: DialogOptions): DialogHandle {
  const element = el('div', {
    className: cx('kdl-ui-dialog', `kdl-ui-dialog--${options.size ?? 'md'}`, options.className),
  });
  const modal = createModal(element, options);
  const { body, footer } = buildPanel(element, options, modal.close);
  return { ...modal, element, body, footer };
}
