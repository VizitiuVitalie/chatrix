export const USER_SEARCH_MIN_QUERY_LENGTH = 1;

export const USER_SEARCH_DEBOUNCE_MS = 250;

export const USER_SEARCH_LIMIT = 20;

export {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from '@/shared/constants/validation.constants';

export const BIO_MAX_LENGTH = 280;

export const CHAT_AVATAR_SYNTHETIC_ID_OFFSET = 1_000_000;

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const THEME_STORAGE_KEY = 'chatrix.theme';

export const ALLOWED_AVATAR_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'heic',
  'heif',
  'avif',
]);

export const MY_STORAGE_QUERY_KEY = ['users', 'me', 'storage'] as const;
