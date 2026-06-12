import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { KEYBOARD_OPEN_RATIO } from '@/shared/constants/auth-layout.constants';
import { AuthShowcase } from '@/shared/ui/auth-showcase';

export function AuthLayout(): ReactElement {
  const [hasFocusedField, setHasFocusedField] = useState<boolean>(false);
  const columnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const column = columnRef.current;
    if (column === null) return;

    const isInput = (target: EventTarget | null): boolean =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;

    const onFocusIn = (event: FocusEvent): void => {
      if (isInput(event.target)) setHasFocusedField(true);
    };
    const onFocusOut = (): void => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (!isInput(active) || !column.contains(active)) {
          setHasFocusedField(false);
        }
      }, 60);
    };

    column.addEventListener('focusin', onFocusIn);
    column.addEventListener('focusout', onFocusOut);
    return (): void => {
      column.removeEventListener('focusin', onFocusIn);
      column.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (vv === null || vv === undefined) return;

    let wasOpen = vv.height / window.innerHeight < KEYBOARD_OPEN_RATIO;
    const checkAndBlur = (): void => {
      const isOpen = vv.height / window.innerHeight < KEYBOARD_OPEN_RATIO;
      if (wasOpen && !isOpen) {
        const active = document.activeElement;
        const column = columnRef.current;
        if (
          (active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement) &&
          column !== null &&
          column.contains(active)
        ) {
          active.blur();
        }
      }
      wasOpen = isOpen;
    };

    vv.addEventListener('resize', checkAndBlur);
    const pollId = window.setInterval(checkAndBlur, 250);
    return (): void => {
      vv.removeEventListener('resize', checkAndBlur);
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const EDGE_THRESHOLD_PX = 30;
    const MOVE_THRESHOLD_PX = 40;
    let touchStartX: number | null = null;

    const onTouchStart = (event: TouchEvent): void => {
      const first = event.touches[0];
      if (first === undefined) return;
      touchStartX = first.clientX <= EDGE_THRESHOLD_PX ? first.clientX : null;
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (touchStartX === null) return;
      const first = event.touches[0];
      if (first === undefined) return;
      if (first.clientX - touchStartX < MOVE_THRESHOLD_PX) return;
      touchStartX = null;
      const active = document.activeElement;
      const column = columnRef.current;
      if (
        (active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement) &&
        column !== null &&
        column.contains(active)
      ) {
        active.blur();
      }
    };
    const onTouchEnd = (): void => {
      touchStartX = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return (): void => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <div className="bg-background min-h-dvh lg:grid lg:grid-cols-[minmax(0,520px)_1fr]">
      <div
        ref={columnRef}
        data-auth-column
        className="bg-card flex h-dvh flex-col overflow-y-auto pt-[env(safe-area-inset-top)] lg:h-auto lg:min-h-screen lg:justify-center lg:overflow-hidden lg:pt-0"
      >
        <div className="bg-card min-h-full shrink-0 px-6 py-6 sm:px-12 sm:py-8 lg:min-h-0 lg:px-16 lg:py-20">
          <Outlet />
        </div>
        {hasFocusedField && (
          <div aria-hidden className="bg-card h-screen shrink-0 lg:hidden" />
        )}
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-bubble-out)] via-[var(--color-secondary)] to-[var(--color-accent)] lg:flex">
        <AuthShowcase />
      </div>
    </div>
  );
}
