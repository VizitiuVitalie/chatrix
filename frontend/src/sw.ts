/// <reference lib="webworker" />

import {
  NOTIFICATION_ICON_URL,
  NOTIFICATION_TAG_PREFIX,
  SW_VERSION,
} from './modules/push/constants/push.constants';
import type { NotificationClickData } from './modules/push/interfaces/notification-click-data.interface';
import type { PushPayload } from './modules/push/interfaces/push-payload.interface';
import type { SwClientMessage } from './modules/push/interfaces/sw-client-message.type';
import type { SwInboundMessage } from './modules/push/interfaces/sw-inbound-message.type';

declare const self: ServiceWorkerGlobalScope;

let cachedAccessToken: string | null = null;

let cachedPushEnabled = true;

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data;
  if (data === null) {
    return;
  }

  event.waitUntil(
    (async (): Promise<void> => {
      if (!cachedPushEnabled) {
        return;
      }

      let payload: PushPayload;
      try {
        payload = data.json() as PushPayload;
      } catch (err) {
        console.error('[sw] failed to parse push payload', err);
        return;
      }

      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const anyFocused = clientList.some((c) => c.focused);
      if (anyFocused) {
        return;
      }

      const clickData: NotificationClickData = {
        url: payload.url,
        chatId: payload.chatId,
        messageId: payload.messageId,
      };
      const notificationOptions: NotificationOptions & {
        renotify: boolean;
      } = {
        body: payload.body,
        tag: `${NOTIFICATION_TAG_PREFIX}${String(payload.chatId)}`,
        renotify: true,
        icon: NOTIFICATION_ICON_URL,
        badge: NOTIFICATION_ICON_URL,
        data: clickData,
      };
      await self.registration.showNotification(
        payload.title,
        notificationOptions,
      );
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data as NotificationClickData | undefined;
  const targetUrl = data?.url ?? '/chats';
  const chatId = data?.chatId;

  event.waitUntil(
    (async (): Promise<void> => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          if (chatId !== undefined) {
            const message: SwClientMessage = {
              type: 'navigate-to-chat',
              chatId,
            };
            client.postMessage(message);
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async (): Promise<void> => {
      console.warn(
        '[sw] push subscription changed — asking clients to re-subscribe',
      );
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const message: SwClientMessage = { type: 'push-resubscribe' };
      for (const client of clientList) {
        client.postMessage(message);
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data as SwInboundMessage | null;
  if (data === null || typeof data !== 'object') return;
  if (data.type === 'set-access-token') {
    cachedAccessToken = typeof data.token === 'string' ? data.token : null;
    return;
  }
  if (data.type === 'set-push-enabled') {
    cachedPushEnabled = data.enabled;
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/api/files/')) return;
  event.respondWith(authenticateFileRequest(event.request));
});

async function authenticateFileRequest(request: Request): Promise<Response> {
  if (cachedAccessToken === null) {
    return fetch(request);
  }
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${cachedAccessToken}`);
  return fetch(new Request(request, { headers }));
}

console.info('[sw] loaded version', SW_VERSION);
