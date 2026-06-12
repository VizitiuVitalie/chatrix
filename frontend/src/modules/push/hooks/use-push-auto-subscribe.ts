import { useEffect, useRef } from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import { attemptSubscribe } from '../services/push-subscribe-flow.service';
import { attemptUnsubscribe } from '../services/push-unsubscribe-flow.service';
import { useVapidPublicKeyQuery } from './use-vapid-public-key-query';

export function usePushAutoSubscribe(): void {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const pushEnabledRef = useRef<boolean>(user?.pushEnabled ?? true);
  useEffect(() => {
    pushEnabledRef.current = user?.pushEnabled ?? true;
  }, [user?.pushEnabled]);
  const vapidQuery = useVapidPublicKeyQuery(userId !== null);
  const lastUserIdRef = useRef<number | null>(null);
  const lastVapidRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const previousUserId = lastUserIdRef.current;
    const previousVapid = lastVapidRef.current;

    if (userId === null) {
      lastUserIdRef.current = null;
      lastVapidRef.current = undefined;
      if (previousUserId !== null) {
        void attemptUnsubscribe(true);
      }
      return;
    }

    if (previousUserId === userId && previousVapid === vapidQuery.data) {
      return;
    }
    lastUserIdRef.current = userId;
    lastVapidRef.current = vapidQuery.data;

    if (!pushEnabledRef.current) {
      return;
    }

    const vapidPublicKey = vapidQuery.data;
    if (vapidPublicKey === undefined) {
      return;
    }

    void attemptSubscribe({
      askPermission: false,
      vapidPublicKey,
    });
  }, [userId, vapidQuery.data]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return;
    }
    if (userId === null) return;
    const maybeKey = vapidQuery.data;
    if (maybeKey === undefined) return;
    const vapidPublicKey: string = maybeKey;

    let status: PermissionStatus | null = null;

    function handleChange(): void {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;
      if (!pushEnabledRef.current) return;
      void attemptSubscribe({ askPermission: false, vapidPublicKey });
    }

    void navigator.permissions
      .query({ name: 'notifications' })
      .then((permissionStatus) => {
        status = permissionStatus;
        status.addEventListener('change', handleChange);
      })
      .catch(() => {});

    return (): void => {
      status?.removeEventListener('change', handleChange);
    };
  }, [userId, vapidQuery.data]);
}
