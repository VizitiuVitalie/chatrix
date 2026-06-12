import type { UseQueryResult } from '@tanstack/react-query';

import type { User } from '@/modules/auth/interfaces/user.interface';

export interface UserSearchQueryResult {
  query: UseQueryResult<User[], Error>;
  debouncedQuery: string;
  isBelowMinLength: boolean;
}
