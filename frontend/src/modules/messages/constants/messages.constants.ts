import type { MessagesListSkeletonRow } from '../interfaces/messages-list-skeleton-row.interface';

export const MIN_MESSAGE_LENGTH = 1;
export const MAX_MESSAGE_LENGTH = 4000;

export const EDIT_WINDOW_MS = 10 * 60 * 1000;

export const SENDER_DELETE_WINDOW_MS = 60 * 60 * 1000;

export const COMPOSER_MAX_HEIGHT_PX = 180;

export const EMOJI_PICKER_DESKTOP_WIDTH_PX = 320;
export const EMOJI_PICKER_DESKTOP_HEIGHT_PX = 400;

export const EMOJI_PICKER_DESKTOP_SIDE_OFFSET_PX = 28;

export const EMOJI_PICKER_HOVER_OPEN_DELAY_MS = 200;
export const EMOJI_PICKER_HOVER_CLOSE_DELAY_MS = 300;

export const EMOJI_PICKER_HOVER_SUPPRESS_AFTER_CLOSE_MS = 500;

export const CONTEXT_MENU_FILENAME_MAX_LENGTH = 14;

export const MOBILE_KEYBOARD_DISMISS_GROW_PX = 50;
export const MOBILE_KEYBOARD_CLOSED_EPSILON_PX = 80;
export const MOBILE_KEYBOARD_DISMISS_RECHECK_MS = 240;

export const STICK_TO_BOTTOM_TOLERANCE_PX = 80;
export const OLDER_MESSAGES_PRELOAD_MARGIN_PX = 1200;
export const SCROLL_IDLE_HIDE_MS = 2000;
export const EDIT_SCROLL_SUPPRESS_MS = 700;

export const MESSAGES_PAGE_SIZE = 50;
export const MESSAGES_STALE_TIME_MS = 10_000;

export const SAME_SENDER_GROUPING_MS = 5 * 60 * 1000;

export const MESSAGES_LIST_SKELETON_ROWS: MessagesListSkeletonRow[] = [
  { side: 'left', width: 'w-48' },
  { side: 'right', width: 'w-60' },
  { side: 'left', width: 'w-40' },
  { side: 'right', width: 'w-32' },
  { side: 'left', width: 'w-52' },
  { side: 'right', width: 'w-44' },
  { side: 'left', width: 'w-56' },
  { side: 'right', width: 'w-36' },
  { side: 'left', width: 'w-44' },
  { side: 'right', width: 'w-60' },
  { side: 'left', width: 'w-40' },
  { side: 'right', width: 'w-48' },
];
