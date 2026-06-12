import type { ChatMember } from './chat-member.interface';

export type PendingMemberConfirm =
  | { kind: 'kick'; member: ChatMember }
  | { kind: 'transfer'; member: ChatMember }
  | { kind: 'leave'; member: ChatMember };
