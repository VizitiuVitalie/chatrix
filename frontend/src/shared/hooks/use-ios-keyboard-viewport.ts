import { useLayoutEffect, type RefObject } from 'react';

import {
  KEYBOARD_HANDOFF_ATTRIBUTE,
  KEYBOARD_HANDOFF_COMPOSER,
} from '@/modules/chats/constants/chats.constants';

import {
  DEFAULT_KEYBOARD_HEIGHT_PX,
  IOS_SCROLL_LOCK_ALLOW_SELECTOR,
  KEYBOARD_CLOSE_TRANSITION,
  KEYBOARD_CLOSE_TRANSITION_MS,
  KEYBOARD_OPEN_DELTA_PX,
  MIN_LEARNABLE_KEYBOARD_PX,
  OPEN_CONTEXT_MENU_SELECTOR,
  SCROLL_BOUNDARY_EPSILON_PX,
} from '../constants/ios-keyboard-viewport.constants';
import { PINCH_ZOOM_SCALE_EPSILON } from '../constants/ios-viewport.constants';
import type { RestorableElementStyles } from '../interfaces/restorable-element-styles.interface';

let learnedKeyboardHeight = 0;

function roundCssPixel(value: number): number {
  return Math.max(0, Math.round(value));
}

function isTextControl(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return [
    'email',
    'number',
    'password',
    'search',
    'tel',
    'text',
    'url',
  ].includes(target.type);
}

function snapshotElementStyles(element: HTMLElement): RestorableElementStyles {
  return {
    height: element.style.height,
    overflow: element.style.overflow,
    overscrollBehavior: element.style.overscrollBehavior,
  };
}

export function primeIosKeyboardViewportForFocusHandoff(): void {
  const viewport = window.visualViewport;
  if (viewport === null || viewport === undefined) return;
  if (viewport.scale > PINCH_ZOOM_SCALE_EPSILON) return;

  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');
  const keyboardOpen =
    window.innerHeight - viewport.height > KEYBOARD_OPEN_DELTA_PX;
  const height = roundCssPixel(
    keyboardOpen ? viewport.height : window.innerHeight,
  );

  html.style.setProperty('--ios-vvh', `${height}px`);
  for (const element of [html, body, root]) {
    if (!(element instanceof HTMLElement)) continue;
    element.style.height = 'var(--ios-vvh)';
    element.style.overflow = 'hidden';
    element.style.overscrollBehavior = 'none';
  }
  html.scrollTop = 0;
  body.scrollTop = 0;
  if (window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
}

function findAllowedScrollElement(
  target: EventTarget | null,
): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const explicit = target.closest(IOS_SCROLL_LOCK_ALLOW_SELECTOR);
  if (explicit instanceof HTMLElement) return explicit;
  if (target instanceof HTMLTextAreaElement) return target;
  return null;
}

function canScrollElement(element: HTMLElement, deltaY: number): boolean {
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= SCROLL_BOUNDARY_EPSILON_PX) return false;

  const isColumnReverse =
    window.getComputedStyle(element).flexDirection === 'column-reverse';
  if (isColumnReverse) {
    const offsetFromBottom = Math.abs(element.scrollTop);
    if (deltaY > 0) {
      return offsetFromBottom < maxScrollTop - SCROLL_BOUNDARY_EPSILON_PX;
    }
    if (deltaY < 0) {
      return offsetFromBottom > SCROLL_BOUNDARY_EPSILON_PX;
    }
    return true;
  }

  if (deltaY > 0) {
    return element.scrollTop > SCROLL_BOUNDARY_EPSILON_PX;
  }
  if (deltaY < 0) {
    return element.scrollTop < maxScrollTop - SCROLL_BOUNDARY_EPSILON_PX;
  }
  return true;
}

export function useIosKeyboardViewport(
  shellRef: RefObject<HTMLElement | null>,
  enabled: boolean = true,
): void {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const viewport = window.visualViewport;
    const shell = shellRef.current;
    if (viewport === null || viewport === undefined || shell === null) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const restore = {
      html: snapshotElementStyles(html),
      body: snapshotElementStyles(body),
      root: root instanceof HTMLElement ? snapshotElementStyles(root) : null,
      iosVvh: html.style.getPropertyValue('--ios-vvh'),
      shellTransition: shell.style.transition,
    };

    let lastHeightPx = -1;
    let lastTouchY = 0;
    let scrollResetFrameId: number | null = null;
    let focusOutCloseFrameId: number | null = null;
    let transitionTimeoutId: number | null = null;
    let isClosingKeyboard = false;

    const keyboardOpen = (): boolean =>
      window.innerHeight - viewport.height > KEYBOARD_OPEN_DELTA_PX;

    const predictedKeyboardHeight = (): number =>
      learnedKeyboardHeight > 0
        ? learnedKeyboardHeight
        : DEFAULT_KEYBOARD_HEIGHT_PX;

    const setHeight = (heightPx: number): void => {
      const rounded = roundCssPixel(heightPx);
      if (rounded === lastHeightPx) return;
      lastHeightPx = rounded;
      html.style.setProperty('--ios-vvh', `${rounded}px`);
      shell.style.setProperty('--ios-vvh', `${rounded}px`);
    };

    const clearClosingTransition = (): void => {
      if (transitionTimeoutId !== null) {
        window.clearTimeout(transitionTimeoutId);
        transitionTimeoutId = null;
      }
      shell.style.transition = restore.shellTransition;
    };

    const enableClosingTransition = (): void => {
      if (transitionTimeoutId !== null) {
        window.clearTimeout(transitionTimeoutId);
      }
      shell.style.transition = KEYBOARD_CLOSE_TRANSITION;
      transitionTimeoutId = window.setTimeout(() => {
        transitionTimeoutId = null;
        shell.style.transition = restore.shellTransition;
      }, KEYBOARD_CLOSE_TRANSITION_MS);
    };

    const cancelPendingFocusOutClose = (): void => {
      if (focusOutCloseFrameId === null) return;
      window.cancelAnimationFrame(focusOutCloseFrameId);
      focusOutCloseFrameId = null;
    };

    const targetInsideOpenContextMenu = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      target.closest(OPEN_CONTEXT_MENU_SELECTOR) !== null;

    const hasOpenContextMenu = (): boolean =>
      document.querySelector(OPEN_CONTEXT_MENU_SELECTOR) !== null;

    const clampElement = (element: HTMLElement): void => {
      element.style.height = 'var(--ios-vvh)';
      element.style.overflow = 'hidden';
      element.style.overscrollBehavior = 'none';
    };

    const clampDocument = (): void => {
      clampElement(html);
      clampElement(body);
      if (root instanceof HTMLElement) {
        clampElement(root);
      }
    };

    const resetDocumentScroll = (): void => {
      html.scrollTop = 0;
      body.scrollTop = 0;
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const scheduleDocumentScrollReset = (): void => {
      if (!keyboardOpen() && viewport.offsetTop <= 0) return;
      if (
        window.scrollY === 0 &&
        html.scrollTop === 0 &&
        body.scrollTop === 0
      ) {
        return;
      }
      if (scrollResetFrameId !== null) return;
      scrollResetFrameId = window.requestAnimationFrame(() => {
        scrollResetFrameId = null;
        resetDocumentScroll();
      });
    };

    const applyVisualViewportHeight = (): void => {
      if (viewport.scale > PINCH_ZOOM_SCALE_EPSILON) return;
      const isOpen = keyboardOpen();
      const keyboard = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      if (keyboard > MIN_LEARNABLE_KEYBOARD_PX) {
        learnedKeyboardHeight = keyboard;
      }
      const useKeyboardHeight = isOpen && !isClosingKeyboard;
      if (!isOpen) {
        isClosingKeyboard = false;
      }
      if (useKeyboardHeight) {
        clearClosingTransition();
      }
      setHeight(useKeyboardHeight ? viewport.height : window.innerHeight);
      clampDocument();
      scheduleDocumentScrollReset();
    };

    const preserveKeyboardZone = (): void => {
      isClosingKeyboard = false;
      clearClosingTransition();
      applyVisualViewportHeight();
      resetDocumentScroll();
    };

    const closeKeyboardZone = (): void => {
      isClosingKeyboard = true;
      enableClosingTransition();
      setHeight(window.innerHeight);
      clampDocument();
      resetDocumentScroll();
    };

    const preShrinkForKeyboard = (): void => {
      if (viewport.scale > PINCH_ZOOM_SCALE_EPSILON) return;
      cancelPendingFocusOutClose();
      if (keyboardOpen()) {
        isClosingKeyboard = false;
        clearClosingTransition();
        return;
      }
      isClosingKeyboard = false;
      clearClosingTransition();
      setHeight(window.innerHeight - predictedKeyboardHeight());
      clampDocument();
      void shell.offsetHeight;
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (!isTextControl(event.target)) return;
      event.target.focus({ preventScroll: true });
      preShrinkForKeyboard();
    };

    const handleFocusIn = (event: FocusEvent): void => {
      if (!isTextControl(event.target)) return;
      cancelPendingFocusOutClose();
      preShrinkForKeyboard();
    };

    const handleTouchStart = (event: TouchEvent): void => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (!keyboardOpen()) return;
      const touch = event.touches[0];
      if (touch === undefined) return;
      const deltaY = touch.clientY - lastTouchY;
      lastTouchY = touch.clientY;

      const scrollElement = findAllowedScrollElement(event.target);
      if (scrollElement !== null && canScrollElement(scrollElement, deltaY)) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }
      resetDocumentScroll();
    };

    const handleFocusOut = (event: FocusEvent): void => {
      if (!isTextControl(event.target) || !shell.contains(event.target)) {
        return;
      }

      const relatedTarget = event.relatedTarget;
      if (isTextControl(relatedTarget) && shell.contains(relatedTarget)) {
        return;
      }

      cancelPendingFocusOutClose();

      const closeIfStillBlurred = (): void => {
        if (
          keyboardOpen() &&
          (hasOpenContextMenu() || targetInsideOpenContextMenu(relatedTarget))
        ) {
          preserveKeyboardZone();
          return;
        }

        closeKeyboardZone();
      };

      if (!keyboardOpen()) {
        closeIfStillBlurred();
        return;
      }

      focusOutCloseFrameId = window.requestAnimationFrame(() => {
        focusOutCloseFrameId = null;
        if (isTextControl(document.activeElement)) return;
        closeIfStillBlurred();
      });
    };

    const handleWindowScroll = (): void => {
      scheduleDocumentScrollReset();
    };

    const handlePageHide = (): void => {
      const active = document.activeElement;
      if (isTextControl(active) && shell.contains(active)) {
        active.blur();
      }
      isClosingKeyboard = true;
      clearClosingTransition();
      setHeight(window.innerHeight);
      clampDocument();
      resetDocumentScroll();
    };

    const handleResume = (): void => {
      const active = document.activeElement;
      if (isTextControl(active) && shell.contains(active)) {
        active.blur();
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      } else {
        handleResume();
      }
    };

    applyVisualViewportHeight();
    viewport.addEventListener('resize', applyVisualViewportHeight, {
      passive: true,
    });
    viewport.addEventListener('scroll', applyVisualViewportHeight, {
      passive: true,
    });
    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
      passive: true,
    });
    document.addEventListener('touchstart', handleTouchStart, {
      capture: true,
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handlePageHide, { passive: true });
    window.addEventListener('pagehide', handlePageHide, { passive: true });
    window.addEventListener('focus', handleResume, { passive: true });
    window.addEventListener('pageshow', handleResume, { passive: true });
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return (): void => {
      viewport.removeEventListener('resize', applyVisualViewportHeight);
      viewport.removeEventListener('scroll', applyVisualViewportHeight);
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
      document.removeEventListener('touchstart', handleTouchStart, {
        capture: true,
      });
      document.removeEventListener('touchmove', handleTouchMove, {
        capture: true,
      });
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollResetFrameId !== null) {
        window.cancelAnimationFrame(scrollResetFrameId);
      }
      cancelPendingFocusOutClose();
      clearClosingTransition();
      const preserveKeyboardHandoff =
        html.getAttribute(KEYBOARD_HANDOFF_ATTRIBUTE) ===
        KEYBOARD_HANDOFF_COMPOSER;
      if (preserveKeyboardHandoff) {
        html.removeAttribute(KEYBOARD_HANDOFF_ATTRIBUTE);
      }
      if (
        !preserveKeyboardHandoff &&
        isTextControl(document.activeElement) &&
        shell.contains(document.activeElement)
      ) {
        document.activeElement.blur();
      }
      resetDocumentScroll();
      html.style.height = restore.html.height;
      html.style.overflow = restore.html.overflow;
      html.style.overscrollBehavior = restore.html.overscrollBehavior;
      body.style.height = restore.body.height;
      body.style.overflow = restore.body.overflow;
      body.style.overscrollBehavior = restore.body.overscrollBehavior;
      if (root instanceof HTMLElement && restore.root !== null) {
        root.style.height = restore.root.height;
        root.style.overflow = restore.root.overflow;
        root.style.overscrollBehavior = restore.root.overscrollBehavior;
      }
      if (restore.iosVvh === '') {
        html.style.removeProperty('--ios-vvh');
      } else {
        html.style.setProperty('--ios-vvh', restore.iosVvh);
      }
      shell.style.removeProperty('--ios-vvh');
    };
  }, [shellRef, enabled]);
}
