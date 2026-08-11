import { useEffect, useRef } from 'react';

export function useBackGestureClose(
  active: boolean,
  onClose: () => void,
  marker: string,
): void {
  const onCloseRef = useRef(onClose);
  const backTimerRef = useRef(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return undefined;
    if (typeof window === 'undefined') return undefined;

    if (backTimerRef.current !== 0) {
      window.clearTimeout(backTimerRef.current);
      backTimerRef.current = 0;
    }

    window.history.pushState({ [marker]: true }, '');
    const handlePopState = (event: PopStateEvent): void => {
      const state = event.state as Record<string, boolean> | null;
      if (state?.[marker] === true) return;
      onCloseRef.current();
    };
    window.addEventListener('popstate', handlePopState);

    return (): void => {
      window.removeEventListener('popstate', handlePopState);
      const state = window.history.state as Record<string, boolean> | null;
      if (state?.[marker] === true) {
        backTimerRef.current = window.setTimeout(() => {
          backTimerRef.current = 0;
          window.history.back();
        }, 0);
      }
    };
  }, [active, marker]);
}
