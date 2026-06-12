import { Download } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useInstallPrompt } from '../hooks/use-install-prompt';
import { InstallIosModal } from './install-ios-modal';

export function InstallBanner(): ReactElement | null {
  const { t } = useTranslation();
  const installPrompt = useInstallPrompt();
  const [isIosModalOpen, setIosModalOpen] = useState<boolean>(false);

  if (
    installPrompt.platform !== 'installable' &&
    installPrompt.platform !== 'ios'
  ) {
    return null;
  }

  function handleInstall(): void {
    if (installPrompt.platform === 'ios') {
      setIosModalOpen(true);
      return;
    }
    void installPrompt.install();
  }

  return (
    <>
      <section className="bg-card border-border mb-4 flex items-center gap-3 rounded-xl border px-3 py-2 shadow-sm">
        <div className="bg-primary/10 text-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {t('pwa.banner.title')}
          </p>
          <p className="text-muted-foreground hidden text-xs lg:block">
            {t('pwa.banner.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          {t('pwa.banner.install')}
        </button>
      </section>

      <InstallIosModal
        open={isIosModalOpen}
        onClose={() => {
          setIosModalOpen(false);
        }}
      />
    </>
  );
}
