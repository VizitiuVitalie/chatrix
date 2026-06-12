import { useEffect } from 'react';

import {
  COMPOSER_SELECTOR,
  OPEN_MODAL_SELECTOR,
  SEARCH_SELECTOR,
} from '../constants/type-to-focus.constants';

function isPrintableKey(event: KeyboardEvent): boolean {
  if (event.isComposing || event.keyCode === 229) return false;
  if (event.key.length !== 1) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return true;
}

function isAlreadyTypingTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.tagName === 'INPUT') return true;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'SELECT') return true;
  if (element.isContentEditable) return true;
  return false;
}

function isInsideOpenOverlay(element: Element | null): boolean {
  if (element === null) return false;
  return element.closest('[data-state="open"]') !== null;
}

function isAnyModalOpen(): boolean {
  return document.querySelector(OPEN_MODAL_SELECTOR) !== null;
}

export function useGlobalTypeToFocus(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (!isPrintableKey(event)) return;
      const active = document.activeElement;
      if (isAlreadyTypingTarget(active)) return;
      if (isInsideOpenOverlay(active)) return;
      if (isAnyModalOpen()) return;
      const composer =
        document.querySelector<HTMLTextAreaElement>(COMPOSER_SELECTOR);
      if (composer !== null) {
        composer.focus({ preventScroll: true });
        return;
      }
      const search = document.querySelector<HTMLInputElement>(SEARCH_SELECTOR);
      if (search !== null) {
        search.focus({ preventScroll: true });
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
