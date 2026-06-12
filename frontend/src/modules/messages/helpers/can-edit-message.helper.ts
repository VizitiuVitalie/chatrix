import type { Message } from '../interfaces/message.interface';

export function canEditMessage(
  message: Message,
  currentUserId: number,
): boolean {
  if (message.senderId !== currentUserId) return false;
  if (message.status === 'pending' || message.status === 'failed') return false;
  if (message.content === null) return false;
  return true;
}
