import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { editMessageRequest } from '../api/messages.api';
import type { EditMessageContext } from '../interfaces/edit-message-context.interface';
import type { EditMessageVariables } from '../interfaces/edit-message-variables.interface';
import type { Message } from '../interfaces/message.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';
import { messagesQueryKey } from './use-messages-query';
import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';

export function useEditMessageMutation(): UseMutationResult<
  Message,
  Error,
  EditMessageVariables,
  EditMessageContext
> {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, EditMessageVariables, EditMessageContext>({
    mutationFn: ({ messageId, content }) =>
      editMessageRequest(messageId, { content }),

    onMutate: ({ messageId, chatId, content }) => {
      const optimisticEditedAt = new Date().toISOString();
      let previousContent: string | null = null;
      let previousEditedAt: string | null = null;

      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => {
          if (!data) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => {
              if (m.id !== messageId) return m;
              previousContent = m.content;
              previousEditedAt = m.editedAt;
              return { ...m, content, editedAt: optimisticEditedAt };
            }),
          }));
          return { ...data, pages };
        },
      );

      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== chatId) return c;
          if (c.lastMessage === null || c.lastMessage.id !== messageId) {
            return c;
          }
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              content,
              editedAt: optimisticEditedAt,
            },
          };
        });
      });

      return { previousContent, previousEditedAt };
    },

    onSuccess: (serverMessage, variables) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(variables.chatId),
        (data) => {
          if (!data) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === variables.messageId ? serverMessage : m,
            ),
          }));
          return { ...data, pages };
        },
      );

      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== variables.chatId) return c;
          if (
            c.lastMessage === null ||
            c.lastMessage.id !== variables.messageId
          ) {
            return c;
          }
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              content: serverMessage.content,
              editedAt: serverMessage.editedAt,
              updatedAt: serverMessage.updatedAt,
            },
          };
        });
      });
    },

    onError: (_error, variables, context) => {
      if (!context) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(variables.chatId),
        (data) => {
          if (!data) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === variables.messageId
                ? {
                    ...m,
                    content: context.previousContent,
                    editedAt: context.previousEditedAt,
                  }
                : m,
            ),
          }));
          return { ...data, pages };
        },
      );

      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== variables.chatId) return c;
          if (
            c.lastMessage === null ||
            c.lastMessage.id !== variables.messageId
          ) {
            return c;
          }
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              content: context.previousContent,
              editedAt: context.previousEditedAt,
            },
          };
        });
      });
    },
  });
}
