import { SAME_SENDER_GROUPING_MS } from '../constants/messages.constants';
import type { Message } from '../interfaces/message.interface';
import type { MessageDayGroup } from '../interfaces/message-day-group.interface';

export function groupMessagesByDay(messages: Message[]): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  let current: MessageDayGroup | null = null;

  for (const message of messages) {
    const createdAt = new Date(message.createdAt);
    const dayKey = toLocalDayKey(createdAt);

    if (current === null || current.dayKey !== dayKey) {
      const day = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
      );
      current = { dayKey, day, messages: [message] };
      groups.push(current);
    } else {
      current.messages.push(message);
    }
  }

  return groups;
}

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameSenderRun(earlier: Message, later: Message): boolean {
  if (earlier.senderId !== later.senderId) return false;
  const gapMs =
    new Date(later.createdAt).getTime() - new Date(earlier.createdAt).getTime();
  return gapMs <= SAME_SENDER_GROUPING_MS;
}
