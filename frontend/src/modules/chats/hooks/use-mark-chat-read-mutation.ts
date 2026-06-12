import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { markChatReadRequest } from '../api/chats.api';
import type { Chat } from '../interfaces/chat.interface';
import type { ChatMember } from '../interfaces/chat-member.interface';
import type { MarkChatReadVariables } from '../interfaces/mark-chat-read-variables.interface';
import { CHATS_QUERY_KEY } from '../constants/chats.constants';

export function useMarkChatReadMutation(): UseMutationResult<
  ChatMember,
  Error,
  MarkChatReadVariables
> {
  const queryClient = useQueryClient();

  return useMutation<ChatMember, Error, MarkChatReadVariables>({
    mutationFn: ({ chatId }) => markChatReadRequest(chatId),

    onMutate: ({ chatId, currentUserId }) => {
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            members: c.members.map((m) =>
              m.user.id === currentUserId ? { ...m, lastReadAt: nowIso } : m,
            ),
          };
        });
      });
    },

    onSuccess: (serverMember, variables) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== variables.chatId) return c;
          return {
            ...c,
            members: c.members.map((m) =>
              m.id === serverMember.id ? serverMember : m,
            ),
          };
        });
      });
    },
  });
}
