import type { SwTokenMessage } from '@/modules/push/interfaces/sw-token-message.interface';

import type { TokenStore } from './interfaces/token-store.interface';

let accessToken: string | null = null;

function postTokenToServiceWorker(token: string | null): void {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const controller = navigator.serviceWorker.controller;
  if (controller === null) return;
  const message: SwTokenMessage = { type: 'set-access-token', token };
  controller.postMessage(message);
}

export const tokenStore: TokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
    postTokenToServiceWorker(token);
  },
  clear(): void {
    accessToken = null;
    postTokenToServiceWorker(null);
  },
};

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    postTokenToServiceWorker(accessToken);
  });
}
