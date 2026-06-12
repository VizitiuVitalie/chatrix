import { AlertTriangle, RotateCw } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoadErrorStateProps } from '@/shared/interfaces/load-error-state-props.interface';

export function LoadErrorState({
  title,
  description,
  onRetry,
}: LoadErrorStateProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="bg-card border-border flex max-w-sm flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-sm">
        <span className="bg-destructive/10 text-destructive inline-flex h-12 w-12 items-center justify-center rounded-full">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold">{title}</p>
          {description !== undefined && description !== null && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          {t('chats.retry')}
        </button>
      </div>
    </div>
  );
}
