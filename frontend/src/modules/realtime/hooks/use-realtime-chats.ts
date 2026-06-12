import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { User } from '@/modules/auth/interfaces/user.interface';
import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';
import type { ChatMember } from '@/modules/chats/interfaces/chat-member.interface';
import type { Message } from '@/modules/messages/interfaces/message.interface';

import { RealtimeEvent } from '../constants/realtime-events.constants';
import type { ChatDeletedPayload } from '../interfaces/chat-deleted-payload.interface';
import type { ChatMemberRemovedPayload } from '../interfaces/chat-member-removed-payload.interface';
import type { MessageDeletedPayload } from '../interfaces/message-deleted-payload.interface';
import type { UserPresencePayload } from '../interfaces/user-presence-payload.interface';
import { useSocket } from './use-socket';

export function useRealtimeChats(): void {
  const { socket } = useSocket();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    if (!user) return;
    const userId = user.id;

    const handleMessageCreated = (message: Message): void => {
      const existing = queryClient.getQueryData<Chat[]>(CHATS_QUERY_KEY);
      if (!existing) return;
      const idx = existing.findIndex((c) => c.id === message.chatId);
      if (idx === -1) {
        void queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
        void queryClient.invalidateQueries({
          queryKey: ['messages', message.chatId],
        });
        return;
      }
      if (existing[idx].lastMessage?.id === message.id) return;
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        const i = chats.findIndex((c) => c.id === message.chatId);
        if (i === -1) return chats;
        const updated: Chat = {
          ...chats[i],
          lastMessage: {
            id: message.id,
            senderId: message.senderId,
            senderNickname: message.sender.nickname,
            content: message.content,
            editedAt: message.editedAt,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            deletedAt: message.deletedAt,
          },
          updatedAt: message.createdAt,
        };
        return [updated, ...chats.slice(0, i), ...chats.slice(i + 1)];
      });
    };

    const handleMessageEdited = (message: Message): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== message.chatId) return c;
          if (c.lastMessage === null || c.lastMessage.id !== message.id) {
            return c;
          }
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              content: message.content,
              editedAt: message.editedAt,
              updatedAt: message.updatedAt,
            },
          };
        });
      });
    };

    const handleMessageDeleted = (payload: MessageDeletedPayload): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== payload.chatId) return c;
          if (
            c.lastMessage === null ||
            c.lastMessage.id !== payload.messageId
          ) {
            return c;
          }
          return { ...c, lastMessage: payload.newLastMessage };
        });
      });
    };

    const handleChatCreated = (chat: Chat): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return [chat];
        if (chats.some((c) => c.id === chat.id)) return chats;
        return [chat, ...chats];
      });
    };

    const handleChatUpdated = (chat: Chat): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        const idx = chats.findIndex((c) => c.id === chat.id);
        if (idx === -1) return chats;
        return [...chats.slice(0, idx), chat, ...chats.slice(idx + 1)];
      });
    };

    const handleChatDeleted = (payload: ChatDeletedPayload): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.filter((c) => c.id !== payload.chatId);
      });
      queryClient.removeQueries({ queryKey: ['messages', payload.chatId] });
    };

    const handleMemberAdded = (member: ChatMember): void => {
      const cached = queryClient.getQueryData<Chat[]>(CHATS_QUERY_KEY);
      if (member.user.id === userId) {
        if (!cached || !cached.some((c) => c.id === member.chatId)) {
          void queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
          return;
        }
      }
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== member.chatId) return c;
          if (c.members.some((m) => m.id === member.id)) return c;
          return { ...c, members: [...c.members, member] };
        });
      });
    };

    const handleMemberRemoved = (payload: ChatMemberRemovedPayload): void => {
      if (payload.userId === userId) {
        queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) =>
          chats ? chats.filter((c) => c.id !== payload.chatId) : chats,
        );
        queryClient.removeQueries({ queryKey: ['messages', payload.chatId] });
        return;
      }
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.id !== payload.chatId) return c;
          return {
            ...c,
            members: c.members.filter((m) => m.userId !== payload.userId),
          };
        });
      });
    };

    const handleMemberRoleChanged = (member: ChatMember): void => {
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
    };

    const handleMemberRead = (member: ChatMember): void => {
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
    };

    const handleUserPresence = (payload: UserPresencePayload): void => {
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        let touched = false;
        const next = chats.map((c) => {
          let memberTouched = false;
          const members = c.members.map((m) => {
            if (m.user.id !== payload.userId) return m;
            const nextLastSeenAt = payload.lastSeenAt ?? m.user.lastSeenAt;
            if (
              m.user.isOnline === payload.isOnline &&
              m.user.lastSeenAt === nextLastSeenAt
            ) {
              return m;
            }
            memberTouched = true;
            return {
              ...m,
              user: {
                ...m.user,
                isOnline: payload.isOnline,
                lastSeenAt: nextLastSeenAt,
              },
            };
          });
          if (!memberTouched) return c;
          touched = true;
          return { ...c, members };
        });
        return touched ? next : chats;
      });
    };

    const handleUserUpdated = (payload: User): void => {
      if (payload.id === userId) {
        setUser({
          ...payload,
          theme: user?.theme ?? payload.theme,
          pushEnabled: user?.pushEnabled ?? payload.pushEnabled,
        });
      }
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        let touched = false;
        const next = chats.map((c) => {
          let memberTouched = false;
          const members = c.members.map((m) => {
            if (m.user.id !== payload.id) return m;
            memberTouched = true;
            return {
              ...m,
              user: { ...payload, isOnline: m.user.isOnline },
            };
          });
          if (!memberTouched) return c;
          touched = true;
          return { ...c, members };
        });
        return touched ? next : chats;
      });
    };

    socket.on(RealtimeEvent.MESSAGE_CREATED, handleMessageCreated);
    socket.on(RealtimeEvent.MESSAGE_EDITED, handleMessageEdited);
    socket.on(RealtimeEvent.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(RealtimeEvent.CHAT_CREATED, handleChatCreated);
    socket.on(RealtimeEvent.CHAT_UPDATED, handleChatUpdated);
    socket.on(RealtimeEvent.CHAT_DELETED, handleChatDeleted);
    socket.on(RealtimeEvent.CHAT_MEMBER_ADDED, handleMemberAdded);
    socket.on(RealtimeEvent.CHAT_MEMBER_REMOVED, handleMemberRemoved);
    socket.on(RealtimeEvent.CHAT_MEMBER_ROLE_CHANGED, handleMemberRoleChanged);
    socket.on(RealtimeEvent.CHAT_MEMBER_READ, handleMemberRead);
    socket.on(RealtimeEvent.USER_PRESENCE, handleUserPresence);
    socket.on(RealtimeEvent.USER_UPDATED, handleUserUpdated);

    return (): void => {
      socket.off(RealtimeEvent.MESSAGE_CREATED, handleMessageCreated);
      socket.off(RealtimeEvent.MESSAGE_EDITED, handleMessageEdited);
      socket.off(RealtimeEvent.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(RealtimeEvent.CHAT_CREATED, handleChatCreated);
      socket.off(RealtimeEvent.CHAT_UPDATED, handleChatUpdated);
      socket.off(RealtimeEvent.CHAT_DELETED, handleChatDeleted);
      socket.off(RealtimeEvent.CHAT_MEMBER_ADDED, handleMemberAdded);
      socket.off(RealtimeEvent.CHAT_MEMBER_REMOVED, handleMemberRemoved);
      socket.off(
        RealtimeEvent.CHAT_MEMBER_ROLE_CHANGED,
        handleMemberRoleChanged,
      );
      socket.off(RealtimeEvent.CHAT_MEMBER_READ, handleMemberRead);
      socket.off(RealtimeEvent.USER_PRESENCE, handleUserPresence);
      socket.off(RealtimeEvent.USER_UPDATED, handleUserUpdated);
    };
  }, [socket, user, setUser, queryClient]);
}
