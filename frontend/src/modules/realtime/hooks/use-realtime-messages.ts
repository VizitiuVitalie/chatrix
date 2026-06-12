import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { upsertMessageIntoPages } from '@/modules/messages/helpers/upsert-message-into-pages.helper';
import { messagesQueryKey } from '@/modules/messages/hooks/use-messages-query';
import type { Message } from '@/modules/messages/interfaces/message.interface';
import type { MessagesPage } from '@/modules/messages/interfaces/messages-page.interface';

import { RealtimeEvent } from '../constants/realtime-events.constants';
import type { MessageDeletedPayload } from '../interfaces/message-deleted-payload.interface';
import { useSocket } from './use-socket';

export function useRealtimeMessages(chatId: number): void {
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    if (!user) return;
    if (Number.isNaN(chatId)) return;

    const handleCreated = (message: Message): void => {
      if (message.chatId !== chatId) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => upsertMessageIntoPages(data, message),
      );
    };

    const handleEdited = (message: Message): void => {
      if (message.chatId !== chatId) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => {
          if (!data) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => (m.id === message.id ? message : m)),
          }));
          return { ...data, pages };
        },
      );
    };

    const handleDeleted = (payload: MessageDeletedPayload): void => {
      if (payload.chatId !== chatId) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chatId),
        (data) => {
          if (!data) return data;
          const pages = data.pages.map((page) => ({
            ...page,
            items: page.items.filter((m) => m.id !== payload.messageId),
          }));
          return { ...data, pages };
        },
      );
    };

    socket.on(RealtimeEvent.MESSAGE_CREATED, handleCreated);
    socket.on(RealtimeEvent.MESSAGE_EDITED, handleEdited);
    socket.on(RealtimeEvent.MESSAGE_DELETED, handleDeleted);

    return (): void => {
      socket.off(RealtimeEvent.MESSAGE_CREATED, handleCreated);
      socket.off(RealtimeEvent.MESSAGE_EDITED, handleEdited);
      socket.off(RealtimeEvent.MESSAGE_DELETED, handleDeleted);
    };
  }, [socket, user, chatId, queryClient]);
}
