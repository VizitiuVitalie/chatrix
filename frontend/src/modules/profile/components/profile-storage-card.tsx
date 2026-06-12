import { HardDrive, Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useMyStorageQuery } from '@/modules/users/hooks/use-my-storage-query';

import { formatBytes } from '../helpers/format-bytes.helper';

export function ProfileStorageCard(): ReactElement {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMyStorageQuery();

  return (
    <section className="bg-card border-border rounded-2xl border p-6">
      <header className="mb-3 flex items-center gap-2">
        <HardDrive className="text-muted-foreground h-4 w-4" />
        <h3 className="text-foreground text-sm font-semibold">
          {t('profile.storage.heading')}
        </h3>
      </header>

      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">{t('profile.storage.error')}</p>
      )}

      {data && (
        <>
          <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary absolute left-0 top-0 h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.min(100, data.percentUsed)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t('profile.storage.usedOf', {
                used: formatBytes(data.usedBytes),
                quota: formatBytes(data.quotaBytes),
              })}
            </span>
            <span className="text-foreground font-semibold">
              {data.percentUsed}%
            </span>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {t('profile.storage.exemptHint')}
          </p>
        </>
      )}
    </section>
  );
}
