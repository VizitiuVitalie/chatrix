import type { Chat } from './chat.interface';

export interface ChatListRowProps {
  chat: Chat;
  currentUserId: number;
  now: Date;
  onRequestDelete: (chat: Chat) => void;
  onRequestLeave: (chat: Chat) => void;
}
