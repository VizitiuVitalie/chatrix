import type { TFunction } from 'i18next';
import { z } from 'zod';

import {
  NO_WHITESPACE_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../constants/auth.constants';

export function buildLoginSchema(t: TFunction) {
  return z.object({
    username: z
      .string()
      .min(1, t('auth.errors.usernameRequired'))
      .min(USERNAME_MIN_LENGTH, t('auth.errors.usernameTooShort'))
      .max(USERNAME_MAX_LENGTH, t('auth.errors.usernameTooLong'))
      .regex(USERNAME_PATTERN, t('auth.errors.usernameInvalid')),
    password: z
      .string()
      .min(1, t('auth.errors.passwordRequired'))
      .min(PASSWORD_MIN_LENGTH, t('auth.errors.passwordTooShort'))
      .max(PASSWORD_MAX_LENGTH, t('auth.errors.passwordTooLong'))
      .regex(NO_WHITESPACE_PATTERN, t('auth.errors.passwordNoWhitespace')),
  });
}
