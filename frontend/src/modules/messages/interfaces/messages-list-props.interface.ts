import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { Message } from './message.interface';

export interface MessagesListProps {
  chat: Chat;
  messages: Message[];
  currentUserId: number;
  editingMessageId: number | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadOlder: () => void;
  onRetryMessage: (failed: Message) => void;
  onEditMessage: (message: Message) => void;
  onRequestDeleteMessage: (message: Message) => void;
}
