import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';
import type { ChatMember } from '@/modules/chats/interfaces/chat-member.interface';

import { addChatMemberRequest } from '../api/chat-members.api';
import type { AddChatMemberVariables } from '../interfaces/add-chat-member-variables.interface';

export function useAddChatMemberMutation(): UseMutationResult<
  ChatMember,
  Error,
  AddChatMemberVariables
> {
  const queryClient = useQueryClient();

  return useMutation<ChatMember, Error, AddChatMemberVariables>({
    mutationFn: (variables) => addChatMemberRequest(variables),

    onSuccess: (member) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== member.chatId) return c;
          if (c.members.some((m) => m.id === member.id)) return c;
          return { ...c, members: [...c.members, member] };
        });
      });
    },
  });
}
