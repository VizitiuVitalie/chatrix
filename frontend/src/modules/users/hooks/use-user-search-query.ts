import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { searchUsersRequest } from '../api/users.api';
import {
  USER_SEARCH_DEBOUNCE_MS,
  USER_SEARCH_LIMIT,
  USER_SEARCH_MIN_QUERY_LENGTH,
} from '../constants/users.constants';
import type { UserSearchQueryResult } from '../interfaces/user-search-query-result.interface';

export function useUserSearchQuery(query: string): UserSearchQueryResult {
  const debouncedQuery = useDebouncedValue(query, USER_SEARCH_DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();
  const isBelowMinLength = trimmed.length < USER_SEARCH_MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: ['users', 'search', trimmed],
    queryFn: () => searchUsersRequest(trimmed, USER_SEARCH_LIMIT),
    enabled: !isBelowMinLength,
    staleTime: 30_000,
  });

  return {
    query: result,
    debouncedQuery: trimmed,
    isBelowMinLength,
  };
}
