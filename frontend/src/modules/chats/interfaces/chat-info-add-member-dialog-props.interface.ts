import type { Chat } from './chat.interface';

export interface ChatInfoAddMemberDialogProps {
  chat: Chat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
