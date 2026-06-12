import { UNKNOWN_PEER_FALLBACK_NAME } from '../constants/chats.constants';
import type { ChatDisplay } from '../interfaces/chat-display.interface';
import type { Chat } from '../interfaces/chat.interface';

export function displayChat(chat: Chat, currentUserId: number): ChatDisplay {
  if (chat.type === 'group') {
    return {
      name: chat.name ?? UNKNOWN_PEER_FALLBACK_NAME,
      avatarUrl: chat.avatarUrl,
      isGroup: true,
      isOnline: false,
      lastSeenAt: null,
    };
  }

  const peer = chat.members.find((m) => m.user.id !== currentUserId);
  return {
    name: peer?.user.nickname ?? UNKNOWN_PEER_FALLBACK_NAME,
    avatarUrl: peer?.user.avatarUrl ?? null,
    isGroup: false,
    isOnline: peer?.user.isOnline ?? false,
    lastSeenAt: peer?.user.lastSeenAt ?? null,
  };
}
