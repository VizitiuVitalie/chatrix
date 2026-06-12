import { detectIOS } from '@/modules/pwa/helpers/detect-ios.helper';

export const GROUP_NAME_MAX_LENGTH = 100;

export const CHAT_TAP_DISMISS_MAX_MS = 250;
export const CHAT_TAP_DISMISS_MAX_MOVE_PX = 10;
export const SKELETON_ROW_COUNT = 12;

export const CHAT_TABS = ['all', 'unread', 'groups'] as const;

export const IS_IOS = detectIOS();
export const IOS_DRAFT_CONVERSATION_OPEN_CLASS =
  'chatrix-ios-draft-conversation-open';
export const KEYBOARD_HANDOFF_ATTRIBUTE = 'data-chatrix-keyboard-handoff';
export const KEYBOARD_HANDOFF_COMPOSER = 'composer';

export const IOS_KEYBOARD_CLOSE_BEFORE_NAVIGATION_TIMEOUT_MS = 900;
export const IOS_KEYBOARD_CLOSED_STABLE_FRAMES = 6;
export const VISUAL_VIEWPORT_STABLE_EPSILON_PX = 1;
export const INSTANT_DIALOG_CLOSE_CLASS =
  'pointer-events-none opacity-0 data-[state=closed]:hidden data-[state=closed]:animate-none data-[state=open]:animate-none';
export const UNKNOWN_PEER_FALLBACK_NAME = '' as const;

export const CHATS_QUERY_KEY = ['chats'] as const;

export const CHATS_STALE_TIME_MS = 10_000;

export const FOCUS_COMPOSER_STATE_KEY = 'chatrixFocusComposer';
