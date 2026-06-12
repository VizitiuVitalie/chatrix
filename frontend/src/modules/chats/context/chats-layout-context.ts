import { createContext } from 'react';

import type { ChatsLayoutContextValue } from '../interfaces/chats-layout-context-value.interface';

export const ChatsLayoutContext = createContext<ChatsLayoutContextValue | null>(
  null,
);
