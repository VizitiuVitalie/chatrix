import type { Message } from './message.interface';

export interface MessageDayGroup {
  dayKey: string;
  day: Date;
  messages: Message[];
}
