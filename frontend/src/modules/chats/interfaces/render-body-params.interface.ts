import type { useTranslation } from 'react-i18next';

import type { useAuth } from '@/modules/auth/hooks/use-auth';

import type { useChatsQuery } from '../hooks/use-chats-query';
import type { Chat } from './chat.interface';

export interface RenderBodyParams {
  query: ReturnType<typeof useChatsQuery>;
  user: ReturnType<typeof useAuth>['user'];
  visibleChats: Chat[];
  searchValue: string;
  now: Date;
  t: ReturnType<typeof useTranslation>['t'];
  onRequestDelete: (chat: Chat) => void;
  onRequestLeave: (chat: Chat) => void;
}
