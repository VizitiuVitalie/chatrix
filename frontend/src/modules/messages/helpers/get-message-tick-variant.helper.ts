import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { Message } from '../interfaces/message.interface';
import type { MessageTickVariant } from '../interfaces/message-tick-variant.type';
import { computeTickVariant } from './compute-tick-variant.helper';

export function getMessageTickVariant(
  message: Message,
  chat: Chat,
  currentUserId: number,
): MessageTickVariant | null {
  if (message.senderId !== currentUserId) return null;
  if (message.status === 'pending' || message.status === 'failed') return null;
  return computeTickVariant(chat, message.createdAt, currentUserId);
}
