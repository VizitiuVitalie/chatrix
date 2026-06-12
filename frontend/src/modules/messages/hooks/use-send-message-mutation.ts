import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { User } from '@/modules/auth/interfaces/user.interface';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { sendMessageRequest } from '../api/messages.api';
import { buildOptimisticMessage } from '../helpers/build-optimistic-message.helper';
import { upsertMessageIntoPages } from '../helpers/upsert-message-into-pages.helper';
import type { Message } from '../interfaces/message.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';
import type { SendMessageContext } from '../interfaces/send-message-context.interface';
import type { SendMessageVariables } from '../interfaces/send-message-variables.interface';
import { messagesQueryKey } from './use-messages-query';
import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';

let nextTempId = -1;

export function useSendMessageMutation(
  currentUser: User,
): UseMutationResult<Message, Error, SendMessageVariables, SendMessageContext> {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, SendMessageVariables, SendMessageContext>({
    mutationFn: ({ chatId, content, fileIds, clientId }) =>
      sendMessageRequest({ chatId, content, fileIds, clientId }),

    onMutate: ({ chatId, content, clientId, files }) => {
      const contentForCache: string | null = content ?? null;

      let existingTempId: number | null = null;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => {
          if (!data) return data;
          for (const page of data.pages) {
            const found = page.items.find((m) => m.clientId === clientId);
            if (found) {
              existingTempId = found.id;
              break;
            }
          }
          if (existingTempId === null) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.clientId === clientId
                ? {
                    ...m,
                    content: contentForCache,
                    status: 'pending' as const,
                  }
                : m,
            ),
          }));
          return { ...data, pages };
        },
      );

      if (existingTempId !== null) {
        return { clientId, tempId: existingTempId };
      }
      const tempId = nextTempId--;
      const optimistic = buildOptimisticMessage({
        chatId,
        content: contentForCache,
        sender: currentUser,
        clientId,
        tempId,
        files,
      });

      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => {
          if (!data) return data;
          const [firstPage, ...rest] = data.pages;
          if (!firstPage) {
            return {
              ...data,
              pages: [{ items: [optimistic], nextCursor: null }],
            };
          }
          const replaced: MessagesPage = {
            ...firstPage,
            items: [optimistic, ...firstPage.items],
          };
          return { ...data, pages: [replaced, ...rest] };
        },
      );

      return { clientId, tempId };
    },

    onSuccess: (serverMessage, variables, context) => {
      if (!context) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(variables.chatId),
        (data) => upsertMessageIntoPages(data, serverMessage),
      );
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        const idx = chats.findIndex((c) => c.id === variables.chatId);
        if (idx === -1) return chats;
        const updated: Chat = {
          ...chats[idx],
          lastMessage: {
            id: serverMessage.id,
            senderId: serverMessage.senderId,
            senderNickname: serverMessage.sender.nickname,
            content: serverMessage.content,
            editedAt: serverMessage.editedAt,
            createdAt: serverMessage.createdAt,
            updatedAt: serverMessage.updatedAt,
            deletedAt: serverMessage.deletedAt,
          },
          updatedAt: serverMessage.createdAt,
        };
        return [updated, ...chats.slice(0, idx), ...chats.slice(idx + 1)];
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
              m.clientId === context.clientId && m.id < 0
                ? { ...m, status: 'failed' as const }
                : m,
            ),
          }));
          return { ...data, pages };
        },
      );
    },
  });
}
