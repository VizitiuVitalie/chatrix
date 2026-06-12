import { useContext } from 'react';

import { ChatActivityContext } from '../context/chat-activity-context';
import type { ChatActivityRecord } from '../interfaces/chat-activity-record.interface';

const EMPTY: ChatActivityRecord[] = [];

export function useChatActivityRecords(
  chatId: number | null,
): ChatActivityRecord[] {
  const map = useContext(ChatActivityContext);
  if (chatId === null) return EMPTY;
  return map.get(chatId) ?? EMPTY;
}
