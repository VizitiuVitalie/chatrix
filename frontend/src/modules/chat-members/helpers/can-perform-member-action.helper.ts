import type { ChatMemberRole } from '@/modules/chats/interfaces/chat-member-role.type';

import type { MemberActionContext } from '../interfaces/member-action-context.interface';
import type { MemberRowAction } from '../interfaces/member-row-action.type';

export function canPerformMemberAction(
  action: MemberRowAction,
  ctx: MemberActionContext,
): boolean {
  const { viewerRole, targetRole, isSelf } = ctx;

  if (viewerRole === null) return false;
  if (isSelf) return false;

  switch (action) {
    case 'promote-admin':
      return viewerRole === 'owner' && targetRole === 'member';
    case 'demote-member':
      return viewerRole === 'owner' && targetRole === 'admin';
    case 'transfer-ownership':
      return viewerRole === 'owner' && targetRole !== 'owner';
    case 'kick':
      if (targetRole === 'owner') return false;
      if (viewerRole === 'member') return false;
      if (targetRole === 'admin') return viewerRole === 'owner';
      return true;
  }
}

export function canLeaveGroup(viewerRole: ChatMemberRole | null): boolean {
  return viewerRole !== null && viewerRole !== 'owner';
}

export function canAddMembers(viewerRole: ChatMemberRole | null): boolean {
  return viewerRole === 'owner' || viewerRole === 'admin';
}
