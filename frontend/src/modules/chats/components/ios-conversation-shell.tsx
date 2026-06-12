import { useRef, type ReactElement } from 'react';

import { useIosKeyboardViewport } from '@/shared/hooks/use-ios-keyboard-viewport';
import type { IosConversationShellProps } from '../interfaces/ios-conversation-shell-props.interface';

export function IosConversationShell({
  header,
  list,
  composer,
  keyboardViewportEnabled,
  overlays,
  onPointerDown,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: IosConversationShellProps): ReactElement {
  const shellRef = useRef<HTMLDivElement>(null);
  useIosKeyboardViewport(shellRef, keyboardViewportEnabled);

  return (
    <div
      ref={shellRef}
      className="bg-background relative z-30 grid h-[var(--ios-vvh,100dvh)] min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] select-none overflow-hidden overscroll-contain"
      onPointerDown={onPointerDown}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="bg-card/85 border-border/80 border-b pt-[env(safe-area-inset-top)] shadow-[0_4px_16px_oklch(0.28_0.04_270/_0.04)] backdrop-blur-xl">
        {header}
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden">{list}</div>
      <div>{composer}</div>
      {overlays}
    </div>
  );
}
