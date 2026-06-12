import type { ChatLastMessage } from '@/modules/chats/interfaces/chat-last-message.interface';

export interface MessageDeletedPayload {
  chatId: number;
  messageId: number;
  newLastMessage: ChatLastMessage | null;
}
