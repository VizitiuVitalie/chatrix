import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { MessageTickVariant } from '../interfaces/message-tick-variant.type';

export function computeTickVariant(
  chat: Chat,
  createdAt: string,
  currentUserId: number,
): MessageTickVariant {
  const others = chat.members.filter((m) => m.user.id !== currentUserId);
  if (others.length === 0) return 'sent';

  const messageTime = new Date(createdAt).getTime();
  const readers = others.filter(
    (m) =>
      m.lastReadAt !== null && new Date(m.lastReadAt).getTime() >= messageTime,
  );

  if (chat.type === 'direct') {
    return readers.length > 0 ? 'two-blue' : 'sent';
  }

  if (readers.length === 0) return 'sent';
  if (readers.length === others.length) return 'two-blue-with-group';
  return 'two-blue';
}
