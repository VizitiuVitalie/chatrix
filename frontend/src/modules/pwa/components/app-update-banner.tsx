import { RefreshCw, X } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppUpdateCheck } from '../hooks/use-app-update-check';

export function AppUpdateBanner(): ReactElement | null {
  const { t } = useTranslation();
  const updateAvailable = useAppUpdateCheck();
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="bg-card border-border text-foreground pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-lg">
        <RefreshCw className="text-primary h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{t('pwa.update.title')}</span>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 relative rounded-full px-4 py-2 text-sm font-semibold transition-colors after:absolute after:-inset-2 after:content-['']"
        >
          {t('pwa.update.action')}
        </button>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
          }}
          aria-label={t('common.cancel')}
          className="text-muted-foreground hover:bg-secondary -mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
