import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  LONG_PRESS_DELAY_MS,
  LONG_PRESS_MOVE_TOLERANCE_PX,
} from '../constants/context-menu-long-press.constants';
import type { ContextMenuLongPressHandlers } from '../interfaces/context-menu-long-press-handlers.interface';

export function useContextMenuLongPress(): ContextMenuLongPressHandlers {
  const timerRef = useRef<number>(0);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clear = useCallback((): void => {
    window.clearTimeout(timerRef.current);
    timerRef.current = 0;
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        return;
      }
      const target = event.currentTarget;
      const x = event.clientX;
      const y = event.clientY;
      startRef.current = { x, y };
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = 0;
        target.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          }),
        );
      }, LONG_PRESS_DELAY_MS);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      if (timerRef.current === 0) return;
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX) {
        clear();
      }
    },
    [clear],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
  };
}
