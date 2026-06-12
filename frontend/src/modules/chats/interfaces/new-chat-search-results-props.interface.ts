import type { User } from '@/modules/auth/interfaces/user.interface';

import type { NewChatMode } from './new-chat-mode.type';

export interface NewChatSearchResultsProps {
  data: User[] | undefined;
  isFetching: boolean;
  isError: boolean;
  isBelowMinLength: boolean;
  debouncedQuery: string;
  mode: NewChatMode;
  selectedIds: Set<number>;
  onSelect: (user: User) => void;
  isMutating: boolean;
}
