import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';

import { createGroupChatRequest } from '../api/chats.api';
import { messagesQueryKey } from '@/modules/messages/hooks/use-messages-query';
import type { MessagesPage } from '@/modules/messages/interfaces/messages-page.interface';

import type { Chat } from '../interfaces/chat.interface';
import type { CreateGroupChatVariables } from '../interfaces/create-group-chat-variables.interface';
import { CHATS_QUERY_KEY } from '../constants/chats.constants';

export function useCreateGroupChatMutation(): UseMutationResult<
  Chat,
  Error,
  CreateGroupChatVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, memberIds }: CreateGroupChatVariables) =>
      createGroupChatRequest(name, memberIds),
    onSuccess: (chat) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return [chat];
        if (chats.some((c) => c.id === chat.id)) return chats;
        return [chat, ...chats];
      });
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chat.id),
        (messages) =>
          messages ?? {
            pages: [{ items: [], nextCursor: null }],
            pageParams: [undefined],
          },
      );
    },
  });
}
