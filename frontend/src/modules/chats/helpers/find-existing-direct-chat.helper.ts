import type { Chat } from '../interfaces/chat.interface';

export function findExistingDirectChat(
  chats: Chat[] | undefined,
  peerUserId: number,
  currentUserId: number,
): Chat | undefined {
  return chats?.find(
    (c) =>
      c.type === 'direct' &&
      c.members.some((m) => m.user.id === peerUserId) &&
      c.members.some((m) => m.user.id === currentUserId),
  );
}
