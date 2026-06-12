import {
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

export interface IosConversationShellProps {
  header: ReactNode;
  list: ReactNode;
  composer: ReactNode;
  keyboardViewportEnabled: boolean;
  overlays: ReactNode;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}
