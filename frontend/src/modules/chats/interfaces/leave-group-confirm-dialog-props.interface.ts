import type { Chat } from './chat.interface';

export interface PendingChatLeave {
  chat: Chat;
}

export interface LeaveGroupConfirmDialogProps {
  pending: PendingChatLeave | null;
  isPending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}
