import { Download } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useInstallPrompt } from '../hooks/use-install-prompt';
import { InstallIosModal } from './install-ios-modal';

export function InstallTopbarBadge(): ReactElement | null {
  const { t } = useTranslation();
  const installPrompt = useInstallPrompt();
  const [isIosModalOpen, setIosModalOpen] = useState<boolean>(false);

  if (
    installPrompt.platform !== 'installable' &&
    installPrompt.platform !== 'ios'
  ) {
    return null;
  }

  function handleClick(): void {
    if (installPrompt.platform === 'ios') {
      setIosModalOpen(true);
      return;
    }
    void installPrompt.install();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={t('pwa.topbar.install')}
        title={t('pwa.topbar.install')}
        className="text-muted-foreground hover:bg-secondary focus-visible:ring-ring/40 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2"
      >
        <Download className="h-5 w-5" />
      </button>

      <InstallIosModal
        open={isIosModalOpen}
        onClose={() => {
          setIosModalOpen(false);
        }}
      />
    </>
  );
}
