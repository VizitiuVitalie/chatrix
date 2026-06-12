import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getVapidPublicKeyRequest } from '../api/push.api';
import { VAPID_PUBLIC_KEY_QUERY_KEY } from '../constants/push.constants';

export function useVapidPublicKeyQuery(
  enabled: boolean = true,
): UseQueryResult<string, Error> {
  return useQuery<string, Error>({
    queryKey: VAPID_PUBLIC_KEY_QUERY_KEY,
    queryFn: getVapidPublicKeyRequest,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });
}
