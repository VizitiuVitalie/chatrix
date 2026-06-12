import type { ReactElement } from 'react';

export function ChatListRowSkeleton(): ReactElement {
  return (
    <div className="flex animate-pulse items-center gap-3 px-3 py-2.5">
      <div className="bg-foreground/10 h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="bg-foreground/10 h-4 w-32 rounded" />
        <div className="bg-foreground/10 h-3 w-48 rounded" />
      </div>
    </div>
  );
}
