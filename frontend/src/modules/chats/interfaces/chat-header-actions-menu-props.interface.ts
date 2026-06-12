import type { Chat } from './chat.interface';

export interface ChatHeaderActionsMenuProps {
  chat: Chat;
  currentUserId: number;
  onRequestDelete: () => void;
}
