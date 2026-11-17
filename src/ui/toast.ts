import { toast, type ToastHandle, type ToastVariant } from './kit';

export type MessageType = 'info' | 'error' | 'warning' | 'success';

const VARIANTS: Record<MessageType, ToastVariant> = {
  info: 'default',
  error: 'destructive',
  warning: 'warning',
  success: 'success',
};

let last: { message: string; handle: ToastHandle } | null = null;

/** The one notification entry point; a thin wrapper over the kit toast. Repeating a visible message refreshes it. */
export function showMessage(message: string, type: MessageType = 'info'): ToastHandle {
  const variant = VARIANTS[type];
  if (last && last.message === message && last.handle.element.isConnected && last.handle.element.dataset.state !== 'closed') {
    last.handle.update({ variant });
    return last.handle;
  }
  last = { message, handle: toast({ title: message, variant }) };
  return last.handle;
}
