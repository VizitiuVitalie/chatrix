import { memo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  dateSeparatorBucket,
  formatDayLabel,
} from '@/shared/helpers/date.helper';

import type { DateSeparatorProps } from '../interfaces/date-separator-props.interface';

export const DateSeparator = memo(DateSeparatorImpl);

function DateSeparatorImpl({ day, now }: DateSeparatorProps): ReactElement {
  const { t, i18n } = useTranslation();
  const bucket = dateSeparatorBucket(day, now);

  const label =
    bucket === 'today'
      ? t('chat.dateSeparator.today')
      : bucket === 'yesterday'
        ? t('chat.dateSeparator.yesterday')
        : formatDayLabel(day, now, i18n.language);

  return (
    <div className="my-4 flex items-center justify-center">
      <span className="bg-card/70 text-muted-foreground border-border rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
        {label}
      </span>
    </div>
  );
}
