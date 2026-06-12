export const SW_VERSION = '5';

export const NOTIFICATION_TAG_PREFIX = 'chat-';

export const NOTIFICATION_ICON_URL = '/favicon.svg';

export const SW_URL = import.meta.env.DEV ? '/src/sw.ts' : '/sw.js';

export const SW_SCOPE = '/';

export const VAPID_PUBLIC_KEY_QUERY_KEY = ['push', 'vapid-public-key'] as const;
