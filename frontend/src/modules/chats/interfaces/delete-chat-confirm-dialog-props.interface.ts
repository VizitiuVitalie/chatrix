import type { Chat } from './chat.interface';
import type { DeleteChatScope } from './delete-chat-scope.type';

export interface PendingChatDeletion {
  chat: Chat;
}

export interface DeleteChatConfirmDialogProps {
  pending: PendingChatDeletion | null;
  currentUserId: number;
  isPending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (scope: DeleteChatScope) => void;
}
