import { useCallback, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { User } from '@/modules/auth/interfaces/user.interface';

import type { PushToggleApi } from '../interfaces/push-toggle-api.interface';
import type { PushToggleError } from '../interfaces/push-toggle-error.type';
import type { PushToggleState } from '../interfaces/push-toggle-state.type';
import type { SubscribeAttemptResult } from '../interfaces/subscribe-attempt-result.type';
import type { SubscribeFailureMapping } from '../interfaces/subscribe-failure-mapping.interface';
import { attemptSubscribe } from '../services/push-subscribe-flow.service';
import { attemptUnsubscribe } from '../services/push-unsubscribe-flow.service';
import { useUpdatePushPreferenceMutation } from './use-update-push-preference-mutation';
import { useVapidPublicKeyQuery } from './use-vapid-public-key-query';

function deriveBaselineState(user: User | null): PushToggleState {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    typeof Notification === 'undefined'
  ) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  if (user === null) {
    return 'loading';
  }
  return user.pushEnabled ? 'on' : 'off';
}

function mapSubscribeFailure(
  result: SubscribeAttemptResult,
): SubscribeFailureMapping {
  if (result === 'denied') {
    return { state: 'denied', error: null };
  }
  if (result === 'dismissed') {
    return { state: 'off', error: 'permission-dismissed' };
  }
  if (result === 'unsupported') {
    return { state: 'unsupported', error: null };
  }
  return { state: 'off', error: 'subscribe-failed' };
}

export function usePushToggle(): PushToggleApi {
  const { user } = useAuth();
  const baselineState = useMemo<PushToggleState>(
    () => deriveBaselineState(user),
    [user],
  );
  const [optimisticState, setOptimisticState] =
    useState<PushToggleState | null>(null);
  const [lastError, setLastError] = useState<PushToggleError | null>(null);
  const [vapidErrorAcked, setVapidErrorAcked] = useState<boolean>(false);
  const desiredRef = useRef<'on' | 'off' | null>(null);
  const syncingRef = useRef<boolean>(false);
  const vapidQuery = useVapidPublicKeyQuery(true);
  const preferenceMutation = useUpdatePushPreferenceMutation();
  const { mutateAsync: updatePreferenceAsync } = preferenceMutation;

  const state = optimisticState ?? baselineState;

  const effectiveError: PushToggleError | null =
    lastError ??
    (vapidQuery.isError && !vapidErrorAcked ? 'vapid-load-failed' : null);

  const drainSync = useCallback(async (): Promise<void> => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      while (desiredRef.current !== null) {
        const target = desiredRef.current;
        desiredRef.current = null;
        const enable = target === 'on';

        if (enable) {
          const vapidPublicKey = vapidQuery.data;
          if (vapidPublicKey === undefined) {
            if (desiredRef.current === null) {
              setOptimisticState('off');
              setLastError('vapid-load-failed');
            }
            continue;
          }

          try {
            await updatePreferenceAsync(true);
          } catch (err) {
            console.error('[push] toggle ON failed at PATCH(true)', err);
            if (desiredRef.current === null) {
              setOptimisticState('off');
              setLastError('subscribe-failed');
            }
            continue;
          }

          let subscribeResult: SubscribeAttemptResult;
          try {
            subscribeResult = await attemptSubscribe({
              askPermission: true,
              vapidPublicKey,
            });
          } catch (err) {
            console.error('[push] attemptSubscribe threw', err);
            subscribeResult = 'error';
          }

          if (subscribeResult === 'subscribed') {
            continue;
          }

          const fallback = mapSubscribeFailure(subscribeResult);
          try {
            await updatePreferenceAsync(false);
            if (desiredRef.current === null) {
              setOptimisticState(fallback.state);
              if (fallback.error !== null) {
                setLastError(fallback.error);
              }
            }
          } catch (rollbackErr) {
            console.error(
              '[push] rollback PATCH(false) failed after subscribe error',
              rollbackErr,
            );
            if (desiredRef.current === null) {
              setOptimisticState('on');
              setLastError('rollback-failed');
            }
          }
        } else {
          try {
            await updatePreferenceAsync(false);
          } catch (err) {
            console.error('[push] toggle OFF failed at PATCH(false)', err);
            if (desiredRef.current === null) {
              setOptimisticState('on');
              setLastError('subscribe-failed');
            }
            continue;
          }

          try {
            await attemptUnsubscribe(false);
          } catch (err) {
            console.warn(
              '[push] attemptUnsubscribe failed after PATCH(false) committed',
              err,
            );
          }
        }
      }
      setOptimisticState(null);
    } finally {
      syncingRef.current = false;
    }
  }, [updatePreferenceAsync, vapidQuery.data]);

  const toggle = useCallback(async (): Promise<void> => {
    if (state !== 'on' && state !== 'off') return;

    setLastError(null);
    setVapidErrorAcked(false);

    const wantOn = state === 'off';
    setOptimisticState(wantOn ? 'on' : 'off');
    desiredRef.current = wantOn ? 'on' : 'off';

    void drainSync();
  }, [state, drainSync]);

  const dismissError = useCallback((): void => {
    setLastError(null);
    setVapidErrorAcked(true);
  }, []);

  return { state, toggle, lastError: effectiveError, dismissError };
}
