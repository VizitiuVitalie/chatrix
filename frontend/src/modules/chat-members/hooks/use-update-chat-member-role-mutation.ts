import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';
import type { ChatMember } from '@/modules/chats/interfaces/chat-member.interface';

import { updateChatMemberRoleRequest } from '../api/chat-members.api';
import type { UpdateChatMemberRoleVariables } from '../interfaces/update-chat-member-role-variables.interface';

export function useUpdateChatMemberRoleMutation(): UseMutationResult<
  ChatMember,
  Error,
  UpdateChatMemberRoleVariables
> {
  const queryClient = useQueryClient();

  return useMutation<ChatMember, Error, UpdateChatMemberRoleVariables>({
    mutationFn: ({ memberId, role }) =>
      updateChatMemberRoleRequest(memberId, role),

    onSuccess: (member) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== member.chatId) return c;
          return {
            ...c,
            members: c.members.map((m) => (m.id === member.id ? member : m)),
          };
        });
      });
    },
  });
}
