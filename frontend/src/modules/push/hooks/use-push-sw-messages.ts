import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import { postPushEnabledToSw } from '../helpers/post-push-enabled-to-sw.helper';
import { attemptSubscribe } from '../services/push-subscribe-flow.service';
import type { SwClientMessage } from '../interfaces/sw-client-message.type';
import { useVapidPublicKeyQuery } from './use-vapid-public-key-query';

export function usePushSwMessages(): void {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vapidQuery = useVapidPublicKeyQuery(true);
  const pushEnabledRef = useRef<boolean>(user?.pushEnabled === true);
  useEffect(() => {
    const enabled = user?.pushEnabled === true;
    pushEnabledRef.current = enabled;
    postPushEnabledToSw(enabled);
  }, [user?.pushEnabled]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }
    const handleControllerChange = (): void => {
      postPushEnabledToSw(pushEnabledRef.current);
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    );
    return (): void => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    function handleMessage(event: MessageEvent): void {
      const message = event.data as SwClientMessage | undefined;
      if (message === undefined || typeof message !== 'object') return;
      if (message.type === 'navigate-to-chat') {
        navigate(`/chats/${String(message.chatId)}`);
        return;
      }
      if (message.type === 'push-resubscribe') {
        if (!pushEnabledRef.current) {
          return;
        }
        const vapidPublicKey = vapidQuery.data;
        if (vapidPublicKey === undefined) {
          return;
        }
        void attemptSubscribe({ askPermission: false, vapidPublicKey });
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return (): void => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [navigate, vapidQuery.data]);
}
