import { useEffect, useState } from 'react';

import { LG_BREAKPOINT_PX } from '../constants/breakpoints.constants';

export function useIsLg(): boolean {
  const [isLg, setIsLg] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(`(min-width: ${LG_BREAKPOINT_PX}px)`).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${LG_BREAKPOINT_PX}px)`);
    function handleChange(event: MediaQueryListEvent): void {
      setIsLg(event.matches);
    }
    media.addEventListener('change', handleChange);
    return (): void => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  return isLg;
}
