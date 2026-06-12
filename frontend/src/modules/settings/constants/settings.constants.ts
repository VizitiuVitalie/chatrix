import { Monitor, Moon, Sun } from 'lucide-react';

import type { PushToggleError } from '@/modules/push/interfaces/push-toggle-error.type';
import type { Theme } from '@/modules/users/interfaces/theme.type';

export const SUPPORTED_LANGUAGES = [
  { code: 'ro', label: 'Română' },
  { code: 'en', label: 'English' },
] as const;

export type SupportedLanguageCode =
  (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export const PUSH_TOGGLE_ERROR_I18N_KEY: Record<PushToggleError, string> = {
  'permission-dismissed': 'settings.notifications.errors.permissionDismissed',
  'vapid-load-failed': 'settings.notifications.errors.vapidLoadFailed',
  'subscribe-failed': 'settings.notifications.errors.subscribeFailed',
  'rollback-failed': 'settings.notifications.errors.rollbackFailed',
};

export const SUPPORTED_THEMES: ReadonlyArray<{
  value: Theme;
  i18nKey: string;
}> = [
  { value: 'light', i18nKey: 'settings.theme.options.light' },
  { value: 'dark', i18nKey: 'settings.theme.options.dark' },
  { value: 'system', i18nKey: 'settings.theme.options.system' },
];
