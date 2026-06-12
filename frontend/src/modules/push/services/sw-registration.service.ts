import { SW_SCOPE, SW_URL } from '../constants/push.constants';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE,
      type: 'module',
    });
    return registration;
  } catch (err) {
    console.error('[push] service worker registration failed', err);
    return null;
  }
}
