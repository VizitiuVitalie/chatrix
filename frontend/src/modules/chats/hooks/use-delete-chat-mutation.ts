import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { deleteChatRequest } from '../api/chats.api';
import type { Chat } from '../interfaces/chat.interface';
import type { DeleteChatMutationVariables } from '../interfaces/delete-chat-mutation-variables.interface';
import { CHATS_QUERY_KEY } from '../constants/chats.constants';

export function useDeleteChatMutation(): UseMutationResult<
  void,
  Error,
  DeleteChatMutationVariables
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteChatMutationVariables>({
    mutationFn: ({ chatId, scope }) => deleteChatRequest(chatId, scope),

    onSuccess: (_data, { chatId }) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.filter((c) => c.id !== chatId);
      });
      queryClient.removeQueries({ queryKey: ['messages', chatId] });
    },
  });
}
