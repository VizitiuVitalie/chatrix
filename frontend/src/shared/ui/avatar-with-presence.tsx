import type { ReactElement } from 'react';

import type { AvatarWithPresenceProps } from '@/shared/interfaces/avatar-with-presence-props.interface';
import { cn } from '@/shared/lib/utils';

import { Avatar } from './avatar';

export function AvatarWithPresence({
  children,
  isOnline,
  className,
  dotClassName,
}: AvatarWithPresenceProps): ReactElement {
  return (
    <span className="relative inline-block shrink-0">
      <Avatar className={className}>{children}</Avatar>
      {isOnline === true && (
        <span
          aria-hidden
          className={cn(
            'ring-card absolute bottom-0 right-0 inline-block h-2 w-2 rounded-full bg-emerald-500 ring-2',
            dotClassName,
          )}
        />
      )}
    </span>
  );
}
