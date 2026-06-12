import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { removeChatMemberRequest } from '../api/chat-members.api';
import type { RemoveChatMemberVariables } from '../interfaces/remove-chat-member-variables.interface';

export function useRemoveChatMemberMutation(
  currentUserId: number,
): UseMutationResult<void, Error, RemoveChatMemberVariables> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveChatMemberVariables>({
    mutationFn: ({ memberId }) => removeChatMemberRequest(memberId),

    onSuccess: (_, { memberId, chatId }) => {
      const chats = queryClient.getQueryData<Chat[]>(CHATS_QUERY_KEY);
      if (!chats) return;
      const chat = chats.find((c) => c.id === chatId);
      const removedMember = chat?.members.find((m) => m.id === memberId);
      const isSelfLeave =
        removedMember !== undefined && removedMember.userId === currentUserId;

      if (isSelfLeave) {
        queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (current) =>
          current ? current.filter((c) => c.id !== chatId) : current,
        );
        queryClient.removeQueries({ queryKey: ['messages', chatId] });
        return;
      }

      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (current) => {
        if (!current) return current;
        return current.map((c) => {
          if (c.id !== chatId) return c;
          return { ...c, members: c.members.filter((m) => m.id !== memberId) };
        });
      });
    },
  });
}
