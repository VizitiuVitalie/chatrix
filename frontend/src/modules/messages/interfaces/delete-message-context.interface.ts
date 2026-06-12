import type { Message } from './message.interface';

export interface DeleteMessageContext {
  snapshot: Message | null;
  pageIndex: number;
  itemIndex: number;
}
