import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { updateChatRequest } from '../api/chats.api';
import type { Chat } from '../interfaces/chat.interface';
import { CHATS_QUERY_KEY } from '../constants/chats.constants';
import type { RenameChatVariables } from '../interfaces/rename-chat-variables.interface';

export function useRenameChatMutation(): UseMutationResult<
  Chat,
  Error,
  RenameChatVariables
> {
  const queryClient = useQueryClient();

  return useMutation<Chat, Error, RenameChatVariables>({
    mutationFn: ({ chatId, name }) => updateChatRequest(chatId, { name }),

    onSuccess: (chat) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        const idx = chats.findIndex((c) => c.id === chat.id);
        if (idx === -1) return chats;
        return [...chats.slice(0, idx), chat, ...chats.slice(idx + 1)];
      });
    },
  });
}
