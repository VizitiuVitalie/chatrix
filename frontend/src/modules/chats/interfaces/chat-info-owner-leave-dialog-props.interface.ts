import type { Chat } from './chat.interface';

export interface ChatInfoOwnerLeaveDialogProps {
  chat: Chat;
  currentUserId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
