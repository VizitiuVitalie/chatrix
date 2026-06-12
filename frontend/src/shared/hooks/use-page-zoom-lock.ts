import { useEffect } from 'react';

import {
  STRIPPED_TOKEN_PREFIXES,
  VIEWPORT_META_SELECTOR,
  ZOOM_LOCK_TOKENS,
  ZOOM_UNLOCK_TOKENS,
} from '../constants/page-zoom-lock.constants';

let baseViewportContent: string | null = null;
let zoomSuspendCount = 0;

function getViewportMeta(): HTMLMetaElement | null {
  return document.querySelector<HTMLMetaElement>(VIEWPORT_META_SELECTOR);
}

function readBaseContent(meta: HTMLMetaElement): string {
  if (baseViewportContent === null) {
    baseViewportContent = meta.content
      .split(',')
      .map((token) => token.trim())
      .filter(
        (token) =>
          !STRIPPED_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix)),
      )
      .join(', ');
  }
  return baseViewportContent;
}

function applyViewport(): void {
  const meta = getViewportMeta();
  if (meta === null) return;
  const base = readBaseContent(meta);
  const zoomTokens =
    zoomSuspendCount > 0 ? ZOOM_UNLOCK_TOKENS : ZOOM_LOCK_TOKENS;
  meta.content = `${base}, ${zoomTokens}`;
}

function preventGestureZoom(event: Event): void {
  if (zoomSuspendCount > 0) return;
  event.preventDefault();
}

export function usePageZoomLock(): void {
  useEffect(() => {
    applyViewport();
    document.addEventListener('gesturestart', preventGestureZoom, {
      passive: false,
    });
    document.addEventListener('gesturechange', preventGestureZoom, {
      passive: false,
    });
    document.addEventListener('gestureend', preventGestureZoom, {
      passive: false,
    });
    return (): void => {
      document.removeEventListener('gesturestart', preventGestureZoom);
      document.removeEventListener('gesturechange', preventGestureZoom);
      document.removeEventListener('gestureend', preventGestureZoom);
    };
  }, []);
}

export function suspendPageZoomLock(): () => void {
  zoomSuspendCount += 1;
  applyViewport();
  return (): void => {
    zoomSuspendCount = Math.max(0, zoomSuspendCount - 1);
    applyViewport();
  };
}
