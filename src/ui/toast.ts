import { getOrCreateContainer } from '../utils/dom';
import { THEME } from '../styles/theme';

let messageBoxTimeout: any = null;

export function showMessage(message: string, type: 'info' | 'error' | 'warning' = 'info'): void {
  const box = getOrCreateContainer('kemono-download-message-box');

  if (type === 'error') box.style.backgroundColor = THEME.colors.toastErrorBg;
  else if (type === 'warning') box.style.backgroundColor = THEME.colors.toastWarningBg;
  else box.style.backgroundColor = THEME.colors.toastInfoBg;
  box.style.color = type === 'warning' ? THEME.colors.toastWarningText : THEME.colors.toastText;

  box.textContent = message;
  box.style.opacity = '1';
  box.style.transform = 'translate(0)';

  if (messageBoxTimeout) clearTimeout(messageBoxTimeout);

  messageBoxTimeout = setTimeout(() => {
    box.style.opacity = '0';
    box.style.transform = 'translate(110%)';
  }, 4000);
}
