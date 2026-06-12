import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { Message } from '../interfaces/message.interface';

export function canDeleteMessage(
  message: Message,
  chat: Chat,
  currentUserId: number,
): boolean {
  if (message.status === 'pending' || message.status === 'failed') return false;

  const isSender = message.senderId === currentUserId;
  if (chat.type === 'direct') return isSender;
  if (isSender) return true;

  const me = chat.members.find((m) => m.user.id === currentUserId);
  if (!me) return false;
  if (me.role === 'owner') return true;
  if (me.role !== 'admin') return false;

  const target = chat.members.find((m) => m.user.id === message.senderId);
  const targetRole = target?.role ?? 'member';
  return targetRole === 'member';
}
