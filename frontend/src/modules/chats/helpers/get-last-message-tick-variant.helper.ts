import { computeTickVariant } from '@/modules/messages/helpers/compute-tick-variant.helper';
import type { MessageTickVariant } from '@/modules/messages/interfaces/message-tick-variant.type';

import type { Chat } from '../interfaces/chat.interface';

export function getLastMessageTickVariant(
  chat: Chat,
  currentUserId: number,
): MessageTickVariant | null {
  const lastMessage = chat.lastMessage;
  if (lastMessage === null) return null;
  if (lastMessage.senderId !== currentUserId) return null;
  return computeTickVariant(chat, lastMessage.createdAt, currentUserId);
}
