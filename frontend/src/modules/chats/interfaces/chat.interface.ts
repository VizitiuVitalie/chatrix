import type { ChatLastMessage } from './chat-last-message.interface';
import type { ChatMember } from './chat-member.interface';
import type { ChatType } from './chat-type.type';

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  avatarUrl: string | null;
  thumbnailUrl: string | null;
  createdById: number | null;
  members: ChatMember[];
  lastMessage: ChatLastMessage | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
