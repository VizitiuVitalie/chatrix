import type { Chat } from '../interfaces/chat.interface';

export function isUnreadForUser(chat: Chat, currentUserId: number): boolean {
  const lm = chat.lastMessage;
  if (lm === null) return false;
  if (lm.senderId === currentUserId) return false;

  const myMembership = chat.members.find((m) => m.user.id === currentUserId);
  if (!myMembership) return false;

  if (myMembership.lastReadAt === null) return true;
  return new Date(lm.createdAt) > new Date(myMembership.lastReadAt);
}
