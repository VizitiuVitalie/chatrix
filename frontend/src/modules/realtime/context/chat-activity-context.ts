import { createContext } from 'react';

import type { ChatActivityRecord } from '../interfaces/chat-activity-record.interface';

export const ChatActivityContext = createContext<
  Map<number, ChatActivityRecord[]>
>(new Map());
