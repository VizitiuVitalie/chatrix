import type { FocusEvent } from 'react';

import {
  SCROLL_DELAY_MS,
  SCROLL_PADDING_TOP_PX,
} from '../constants/auth.constants';

let pendingScrolls: number[] = [];
function cancelPendingScrolls(): void {
  for (const id of pendingScrolls) window.clearTimeout(id);
  pendingScrolls = [];
}

function findFieldBlock(input: HTMLElement): HTMLElement {
  let node: HTMLElement | null = input.parentElement;
  while (node !== null) {
    if (node.querySelector(':scope > label') !== null) return node;
    node = node.parentElement;
  }
  return input;
}

function executeScroll(focused: HTMLElement): void {
  if (!focused.isConnected) return;
  const fieldBlock = findFieldBlock(focused);
  const column = focused.closest('[data-auth-column]') as HTMLElement | null;
  if (column === null) return;

  const fieldRect = fieldBlock.getBoundingClientRect();
  const columnRect = column.getBoundingClientRect();
  const fieldOffsetInColumn = fieldRect.top - columnRect.top + column.scrollTop;
  const targetScrollTop = Math.max(
    0,
    fieldOffsetInColumn - SCROLL_PADDING_TOP_PX,
  );

  column.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
}

export function scrollFormIntoViewOnMobile(
  event: FocusEvent<HTMLElement>,
): void {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(max-width: 1023px)').matches) return;

  const focused = event.target;
  cancelPendingScrolls();
  pendingScrolls.push(
    window.setTimeout(() => {
      executeScroll(focused);
    }, SCROLL_DELAY_MS),
  );
}
