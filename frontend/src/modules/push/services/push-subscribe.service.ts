import { urlBase64ToUint8Array } from '../helpers/url-base64-to-uint8-array.helper';
import type { SubscribePushVariables } from '../interfaces/subscribe-push-variables.interface';

export async function subscribeBrowserToPush(
  vapidPublicKey: string,
): Promise<SubscribePushVariables> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error('unsupported');
  }

  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    throw new Error('permission-denied');
  }
  if (permission !== 'granted') {
    throw new Error('permission-dismissed');
  }

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const json = subscription.toJSON();
  if (
    typeof json.endpoint !== 'string' ||
    !json.keys ||
    typeof json.keys.p256dh !== 'string' ||
    typeof json.keys.auth !== 'string'
  ) {
    throw new Error('subscription-malformed');
  }
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}
