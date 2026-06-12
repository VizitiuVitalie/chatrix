import { useContext } from 'react';

import { ChatsLayoutContext } from '../context/chats-layout-context';
import type { ChatsLayoutContextValue } from '../interfaces/chats-layout-context-value.interface';

export function useChatsLayoutContext(): ChatsLayoutContextValue {
  const value = useContext(ChatsLayoutContext);
  if (value === null) {
    throw new Error('useChatsLayoutContext must be used inside <ChatsLayout>');
  }
  return value;
}
