import type { ReactNode } from 'react';

export interface ConversationHeaderProps {
  name: string;
  avatarUrl: string | null;
  isGroup: boolean;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  activityLabel?: string | null;
  actions?: ReactNode;
  onTitleClick?: () => void;
  onBack?: () => void;
}
