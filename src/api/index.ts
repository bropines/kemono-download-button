import { kemonoApiAdapter } from './kemonoApi';
import { pawchiveApiAdapter } from './pawchiveApi';
import { IApiAdapter } from './types';

export function getApiAdapter(): IApiAdapter {
  const hostname = window.location.hostname;
  if (hostname.includes('pawchive')) {
    return pawchiveApiAdapter;
  }
  return kemonoApiAdapter;
}

export * from './types';
export * from './kemonoApi';
export * from './pawchiveApi';
