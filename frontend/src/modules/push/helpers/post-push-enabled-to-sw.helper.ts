import type { SwPushEnabledMessage } from '../interfaces/sw-push-enabled-message.interface';

export function postPushEnabledToSw(enabled: boolean): void {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const controller = navigator.serviceWorker.controller;
  if (controller === null) return;
  const message: SwPushEnabledMessage = { type: 'set-push-enabled', enabled };
  controller.postMessage(message);
}
