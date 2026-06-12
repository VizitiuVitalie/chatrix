import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';

import { deleteMessageRequest } from '../api/messages.api';
import type { DeleteMessageContext } from '../interfaces/delete-message-context.interface';
import type { DeleteMessageVariables } from '../interfaces/delete-message-variables.interface';
import type { Message } from '../interfaces/message.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';
import { messagesQueryKey } from './use-messages-query';

export function useDeleteMessageMutation(): UseMutationResult<
  void,
  Error,
  DeleteMessageVariables,
  DeleteMessageContext
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteMessageVariables, DeleteMessageContext>(
    {
      mutationFn: ({ messageId }) => deleteMessageRequest(messageId),

      onMutate: ({ messageId, chatId }) => {
        let snapshot: Message | null = null;
        let pageIndex = -1;
        let itemIndex = -1;

        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          messagesQueryKey(chatId),
          (data) => {
            if (!data) return data;
            const pages = data.pages.map((page, pIdx) => {
              const idx = page.items.findIndex((m) => m.id === messageId);
              if (idx === -1) return page;
              snapshot = page.items[idx];
              pageIndex = pIdx;
              itemIndex = idx;
              return {
                ...page,
                items: page.items.filter((m) => m.id !== messageId),
              };
            });
            return { ...data, pages };
          },
        );

        return { snapshot, pageIndex, itemIndex };
      },

      onError: (_error, variables, context) => {
        if (!context || context.snapshot === null) return;
        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          messagesQueryKey(variables.chatId),
          (data) => {
            if (!data) return data;
            const pages = data.pages.map((page, pIdx) => {
              if (pIdx !== context.pageIndex) return page;
              const restored = [...page.items];
              restored.splice(context.itemIndex, 0, context.snapshot!);
              return { ...page, items: restored };
            });
            return { ...data, pages };
          },
        );
      },
    },
  );
}
