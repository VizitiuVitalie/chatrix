import type { Chat } from '../interfaces/chat.interface';
import type { ChatMemberRole } from '../interfaces/chat-member-role.type';

export function getCurrentUserRole(
  chat: Chat,
  currentUserId: number,
): ChatMemberRole | null {
  const member = chat.members.find((m) => m.user.id === currentUserId);
  return member?.role ?? null;
}
