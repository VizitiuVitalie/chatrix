import type { Message } from './message.interface';

export interface MessagesPage {
  items: Message[];
  nextCursor: number | null;
}
