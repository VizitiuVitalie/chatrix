import type { ChatMemberRole } from '@/modules/chats/interfaces/chat-member-role.type';

export interface UpdateChatMemberRoleVariables {
  memberId: number;
  chatId: number;
  role: ChatMemberRole;
}
