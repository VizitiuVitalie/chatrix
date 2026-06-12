import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { fetchMyStorageRequest } from '../api/users.api';
import { MY_STORAGE_QUERY_KEY } from '../constants/users.constants';
import type { UserStorage } from '../interfaces/user-storage.interface';

export { MY_STORAGE_QUERY_KEY };

export function useMyStorageQuery(): UseQueryResult<UserStorage, Error> {
  return useQuery({
    queryKey: MY_STORAGE_QUERY_KEY,
    queryFn: fetchMyStorageRequest,
    staleTime: 10_000,
  });
}
