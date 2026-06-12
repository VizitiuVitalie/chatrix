import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { clearChatAvatarRequest } from '../api/files.api';
import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';

export function useClearChatAvatarMutation(
  chatId: number,
): UseMutationResult<Chat, Error, void> {
  const queryClient = useQueryClient();

  return useMutation<Chat, Error, void>({
    mutationFn: () => clearChatAvatarRequest(chatId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        const idx = chats.findIndex((c) => c.id === updated.id);
        if (idx === -1) return chats;
        return [...chats.slice(0, idx), updated, ...chats.slice(idx + 1)];
      });
    },
  });
}
