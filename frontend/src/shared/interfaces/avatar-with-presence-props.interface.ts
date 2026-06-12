import type { ReactNode } from 'react';

export interface AvatarWithPresenceProps {
  children: ReactNode;
  isOnline?: boolean;
  className?: string;
  dotClassName?: string;
}
