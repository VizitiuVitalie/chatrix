import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { fetchChatsRequest } from '../api/chats.api';
import type { Chat } from '../interfaces/chat.interface';
import {
  CHATS_QUERY_KEY,
  CHATS_STALE_TIME_MS,
} from '../constants/chats.constants';

export function useChatsQuery(): UseQueryResult<Chat[], Error> {
  return useQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: fetchChatsRequest,
    staleTime: CHATS_STALE_TIME_MS,
  });
}
