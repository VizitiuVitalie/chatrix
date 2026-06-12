import type { User } from '@/modules/auth/interfaces/user.interface';

import type { ChatMemberRole } from './chat-member-role.type';

export interface ChatMember {
  id: number;
  chatId: number;
  userId: number;
  role: ChatMemberRole;
  lastReadAt: string | null;
  chatHistoryClearedAt: string | null;
  user: User;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
