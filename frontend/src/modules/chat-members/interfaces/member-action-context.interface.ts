import type { ChatMemberRole } from '@/modules/chats/interfaces/chat-member-role.type';

export interface MemberActionContext {
  viewerRole: ChatMemberRole | null;
  targetRole: ChatMemberRole;
  isSelf: boolean;
}
