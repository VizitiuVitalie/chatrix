import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import {
  KEYBOARD_HANDOFF_ATTRIBUTE,
  KEYBOARD_HANDOFF_COMPOSER,
} from '@/modules/chats/constants/chats.constants';

import {
  DIALOG_KEYBOARD_CLOSE_TRANSITION_MS,
  DIALOG_VIEWPORT_MARGIN_PX,
  DIALOG_VIEWPORT_TRANSITION,
} from '../constants/keyboard-aware-dialog.constants';
import { KEYBOARD_OPEN_DELTA_PX } from '@/shared/constants/ios-keyboard-viewport.constants';

function keyboardOpen(viewport: VisualViewport): boolean {
  return window.innerHeight - viewport.height > KEYBOARD_OPEN_DELTA_PX;
}

function blurActiveTextControl(): void {
  if (
    document.documentElement.getAttribute(KEYBOARD_HANDOFF_ATTRIBUTE) ===
    KEYBOARD_HANDOFF_COMPOSER
  ) {
    return;
  }
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement
  ) {
    active.blur();
  }
}

export function useKeyboardAwareDialogStyle(enabled: boolean): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});
  const wasEnabledRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (viewport === null || viewport === undefined) return undefined;

    let timeoutId: number | null = null;
    const wasEnabled = wasEnabledRef.current;
    wasEnabledRef.current = enabled;

    const update = (closing: boolean = false): void => {
      setStyle({
        top: Math.round(viewport.offsetTop) + DIALOG_VIEWPORT_MARGIN_PX,
        maxHeight: Math.round(viewport.height) - DIALOG_VIEWPORT_MARGIN_PX * 2,
        translate: '-50% 0',
        transition: closing ? DIALOG_VIEWPORT_TRANSITION : undefined,
        '--tw-enter-scale': '1',
        '--tw-exit-scale': '1',
      } as CSSProperties);
    };

    if (!enabled) {
      if (!wasEnabled) return undefined;
      const shouldTrackClose = keyboardOpen(viewport);
      blurActiveTextControl();
      if (!shouldTrackClose) {
        timeoutId = window.setTimeout(() => {
          timeoutId = null;
          setStyle({});
        }, DIALOG_KEYBOARD_CLOSE_TRANSITION_MS);
        return (): void => {
          if (timeoutId !== null) window.clearTimeout(timeoutId);
        };
      }

      const updateClosing = (): void => {
        update(true);
      };
      updateClosing();
      viewport.addEventListener('resize', updateClosing, { passive: true });
      viewport.addEventListener('scroll', updateClosing, { passive: true });
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        viewport.removeEventListener('resize', updateClosing);
        viewport.removeEventListener('scroll', updateClosing);
        setStyle({});
      }, DIALOG_KEYBOARD_CLOSE_TRANSITION_MS);
      return (): void => {
        viewport.removeEventListener('resize', updateClosing);
        viewport.removeEventListener('scroll', updateClosing);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      };
    }

    update(false);
    const updateOpen = (): void => {
      update(false);
    };
    viewport.addEventListener('resize', updateOpen, { passive: true });
    viewport.addEventListener('scroll', updateOpen, { passive: true });
    return (): void => {
      viewport.removeEventListener('resize', updateOpen);
      viewport.removeEventListener('scroll', updateOpen);
    };
  }, [enabled]);

  return style;
}
