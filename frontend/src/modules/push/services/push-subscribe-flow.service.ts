import { subscribePushRequest } from '../api/push.api';
import type { AttemptSubscribeOptions } from '../interfaces/attempt-subscribe-options.interface';
import type { SubscribeAttemptResult } from '../interfaces/subscribe-attempt-result.type';
import { subscribeBrowserToPush } from './push-subscribe.service';

export async function attemptSubscribe({
  askPermission,
  vapidPublicKey,
}: AttemptSubscribeOptions): Promise<SubscribeAttemptResult> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    typeof Notification === 'undefined'
  ) {
    return 'unsupported';
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing !== null) {
      const json = existing.toJSON();
      if (
        typeof json.endpoint === 'string' &&
        json.keys &&
        typeof json.keys.p256dh === 'string' &&
        typeof json.keys.auth === 'string'
      ) {
        await subscribePushRequest({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        return 'subscribed';
      }
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }
    if (Notification.permission === 'default' && !askPermission) {
      return 'skipped';
    }

    const variables = await subscribeBrowserToPush(vapidPublicKey);
    await subscribePushRequest(variables);
    return 'subscribed';
  } catch (err) {
    if (err instanceof Error && err.message === 'permission-denied') {
      return 'denied';
    }
    if (err instanceof Error && err.message === 'permission-dismissed') {
      return 'dismissed';
    }
    if (err instanceof Error && err.message === 'unsupported') {
      return 'unsupported';
    }
    console.error('[push] attemptSubscribe failed', err);
    return 'error';
  }
}
