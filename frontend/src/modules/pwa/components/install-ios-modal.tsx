import { Plus, Share } from 'lucide-react';
import { useEffect, useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import type { InstallIosModalProps } from '../interfaces/install-ios-modal-props.interface';

export function InstallIosModal({
  open,
  onClose,
}: InstallIosModalProps): ReactElement {
  const { t } = useTranslation();

  const onCloseRef = useRef<() => void>(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    if (typeof window === 'undefined') return undefined;
    window.history.pushState({ chatrixInstallIosOpen: true }, '');
    const handlePopState = (): void => {
      onCloseRef.current();
    };
    window.addEventListener('popstate', handlePopState);
    return (): void => {
      window.removeEventListener('popstate', handlePopState);
      const state = window.history.state as {
        chatrixInstallIosOpen?: boolean;
      } | null;
      if (state?.chatrixInstallIosOpen === true) {
        window.history.back();
      }
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pwa.iosModal.title')}</DialogTitle>
          <DialogDescription>{t('pwa.iosModal.description')}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            <span className="text-foreground inline-flex items-center gap-2">
              {t('pwa.iosModal.step1')}
              <Share className="text-primary h-4 w-4" />
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              2
            </span>
            <span className="text-foreground inline-flex items-center gap-2">
              {t('pwa.iosModal.step2')}
              <Plus className="text-primary h-4 w-4" />
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              3
            </span>
            <span className="text-foreground">{t('pwa.iosModal.step3')}</span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
