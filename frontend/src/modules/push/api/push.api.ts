import { apiClient } from '@/shared/api/client';

import type { PushSubscriptionResource } from '../interfaces/push-subscription.interface';
import type { SubscribePushVariables } from '../interfaces/subscribe-push-variables.interface';
import type { VapidPublicKeyResponse } from '../interfaces/vapid-public-key-response.interface';

export async function getVapidPublicKeyRequest(): Promise<string> {
  const response = await apiClient.get<VapidPublicKeyResponse>(
    '/push/vapid-public-key',
  );
  return response.data.publicKey;
}

export async function subscribePushRequest(
  variables: SubscribePushVariables,
): Promise<PushSubscriptionResource> {
  const response = await apiClient.post<PushSubscriptionResource>(
    '/push/subscriptions',
    variables,
  );
  return response.data;
}

export async function unsubscribePushRequest(endpoint: string): Promise<void> {
  await apiClient.delete('/push/subscriptions', {
    data: { endpoint },
  });
}
