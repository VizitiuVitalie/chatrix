import type { ChatMemberRole } from '@/modules/chats/interfaces/chat-member-role.type';

export interface AddChatMemberVariables {
  chatId: number;
  userId: number;
  role?: Exclude<ChatMemberRole, 'owner'>;
}
