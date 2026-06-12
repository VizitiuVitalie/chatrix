import type { TFunction } from 'i18next';
import { z } from 'zod';

import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from '@/shared/constants/validation.constants';

import {
  EMAIL_MAX_LENGTH,
  NICKNAME_EDGE_PATTERN,
  NO_WHITESPACE_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../constants/auth.constants';

export function buildRegisterSchema(t: TFunction) {
  const emailFilled = z
    .email(t('auth.errors.emailInvalid'))
    .max(EMAIL_MAX_LENGTH, t('auth.errors.emailTooLong'))
    .regex(NO_WHITESPACE_PATTERN, t('auth.errors.emailNoWhitespace'));

  return z.object({
    username: z
      .string()
      .min(1, t('auth.errors.usernameRequired'))
      .min(USERNAME_MIN_LENGTH, t('auth.errors.usernameTooShort'))
      .max(USERNAME_MAX_LENGTH, t('auth.errors.usernameTooLong'))
      .regex(USERNAME_PATTERN, t('auth.errors.usernameInvalid')),
    nickname: z
      .string()
      .min(1, t('auth.errors.nicknameRequired'))
      .min(NICKNAME_MIN_LENGTH, t('auth.errors.nicknameTooShort'))
      .max(NICKNAME_MAX_LENGTH, t('auth.errors.nicknameTooLong'))
      .regex(NICKNAME_EDGE_PATTERN, t('auth.errors.nicknameEdgeSpaces')),
    email: z.union([emailFilled, z.literal('')]),
    password: z
      .string()
      .min(1, t('auth.errors.passwordRequired'))
      .min(PASSWORD_MIN_LENGTH, t('auth.errors.passwordTooShort'))
      .max(PASSWORD_MAX_LENGTH, t('auth.errors.passwordTooLong'))
      .regex(NO_WHITESPACE_PATTERN, t('auth.errors.passwordNoWhitespace')),
  });
}
