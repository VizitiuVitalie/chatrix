import type { ReactElement } from 'react';

import { MESSAGES_LIST_SKELETON_ROWS } from '../constants/messages.constants';

export function MessagesListSkeleton(): ReactElement {
  return (
    <div className="flex-1 animate-pulse space-y-3 overflow-y-hidden p-4">
      {MESSAGES_LIST_SKELETON_ROWS.map((row, i) => (
        <div
          key={i}
          className={`flex ${row.side === 'right' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`bg-foreground/[0.085] h-9 rounded-2xl ${row.width}`}
          />
        </div>
      ))}
    </div>
  );
}
