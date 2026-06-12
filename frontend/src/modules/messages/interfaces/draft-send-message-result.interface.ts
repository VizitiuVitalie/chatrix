import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { Message } from './message.interface';

export interface DraftSendMessageResult {
  chat: Chat;
  message: Message;
}
