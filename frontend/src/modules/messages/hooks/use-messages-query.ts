import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';

import { fetchMessagesRequest } from '../api/messages.api';
import {
  MESSAGES_PAGE_SIZE,
  MESSAGES_STALE_TIME_MS,
} from '../constants/messages.constants';
import type { MessagesPage } from '../interfaces/messages-page.interface';

export function messagesQueryKey(chatId: number): readonly [string, number] {
  return ['messages', chatId] as const;
}

export function useMessagesQuery(
  chatId: number,
): UseInfiniteQueryResult<InfiniteData<MessagesPage>, Error> {
  return useInfiniteQuery({
    queryKey: messagesQueryKey(chatId),
    queryFn: ({ pageParam }) =>
      fetchMessagesRequest({
        chatId,
        before: pageParam,
        limit: MESSAGES_PAGE_SIZE,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: MESSAGES_STALE_TIME_MS,
  });
}
