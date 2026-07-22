import { getOrCreateContainer } from '../utils/dom';

let messageBoxTimeout: any = null;

export function showMessage(message: string, type: 'info' | 'error' | 'warning' = 'info'): void {
  const box = getOrCreateContainer('kemono-download-message-box');
  
  if (type === 'error') box.style.backgroundColor = '#dc3545';
  else if (type === 'warning') box.style.backgroundColor = '#ffc107';
  else box.style.backgroundColor = '#333';
  box.style.color = type === 'warning' ? '#212529' : '#fff';
  
  box.textContent = message;
  box.style.opacity = '1';
  box.style.transform = 'translate(0)';
  
  if (messageBoxTimeout) clearTimeout(messageBoxTimeout);
  
  messageBoxTimeout = setTimeout(() => {
    box.style.opacity = '0';
    box.style.transform = 'translate(110%)';
  }, 4000);
}
