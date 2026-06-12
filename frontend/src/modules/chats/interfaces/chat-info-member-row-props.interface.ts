import type { ChatMember } from './chat-member.interface';
import type { ChatMemberRole } from './chat-member-role.type';

export type ChatInfoMemberAction = 'promote' | 'demote' | 'kick' | 'transfer';

export interface ChatInfoMemberRowProps {
  member: ChatMember;
  isSelf: boolean;
  viewerRole: ChatMemberRole | null;
  isPending: boolean;
  onAction: (action: ChatInfoMemberAction, member: ChatMember) => void;
  onSelect: (member: ChatMember) => void;
}
