import { useEffect } from 'react';

export function useBackGestureClose(
  active: boolean,
  onClose: () => void,
  marker: string,
): void {
  useEffect(() => {
    if (!active) return undefined;
    if (typeof window === 'undefined') return undefined;

    window.history.pushState({ [marker]: true }, '');
    const handlePopState = (event: PopStateEvent): void => {
      const state = event.state as Record<string, boolean> | null;
      if (state?.[marker] === true) return;
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return (): void => {
      window.removeEventListener('popstate', handlePopState);
      const state = window.history.state as Record<string, boolean> | null;
      if (state?.[marker] === true) {
        window.history.back();
      }
    };
  }, [active, onClose, marker]);
}
