import type { TFunction } from 'i18next';

import { SEVEN_DAYS_MS } from '../constants/date.constants';
import type { DateSeparatorBucket } from '../interfaces/date-separator-bucket.type';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMessageTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatChatListTime(
  date: Date,
  now: Date,
  locale: string,
): string {
  if (isSameDay(date, now)) {
    return formatMessageTime(date, locale);
  }

  const ageMs = now.getTime() - date.getTime();
  if (ageMs < SEVEN_DAYS_MS) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  }

  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale).format(date);
}

export function dateSeparatorBucket(
  date: Date,
  now: Date,
): DateSeparatorBucket {
  if (isSameDay(date, now)) return 'today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'yesterday';

  const ageMs = now.getTime() - date.getTime();
  if (ageMs < SEVEN_DAYS_MS) return 'thisWeek';

  return 'older';
}

export function formatDayLabel(date: Date, now: Date, locale: string): string {
  return formatChatListTime(date, now, locale);
}

export function formatLastSeen(
  date: Date,
  now: Date,
  locale: string,
  t: TFunction,
): string {
  const ageMs = now.getTime() - date.getTime();
  const ageMin = Math.floor(ageMs / 60_000);
  if (ageMin < 1) return t('presence.lastSeen.justNow');
  if (ageMin < 60) {
    return t('presence.lastSeen.minutesAgo', { count: ageMin });
  }
  const ageHr = Math.floor(ageMin / 60);
  if (isSameDay(date, now)) {
    return t('presence.lastSeen.hoursAgo', { count: ageHr });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return t('presence.lastSeen.yesterdayAt', {
      time: formatMessageTime(date, locale),
    });
  }
  if (ageMs < SEVEN_DAYS_MS) {
    return t('presence.lastSeen.thisWeek', {
      day: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
      time: formatMessageTime(date, locale),
    });
  }
  return t('presence.lastSeen.older', {
    date: new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(date),
  });
}
