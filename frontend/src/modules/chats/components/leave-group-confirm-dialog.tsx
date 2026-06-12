import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

import type { LeaveGroupConfirmDialogProps } from '../interfaces/leave-group-confirm-dialog-props.interface';

export function LeaveGroupConfirmDialog({
  pending,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: LeaveGroupConfirmDialogProps): ReactElement {
  const { t } = useTranslation();

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>
          {t('chats.info.confirmLeave.title')}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {t('chats.info.confirmLeave.description')}
        </AlertDialogDescription>

        {errorMessage !== null && (
          <p className="text-destructive mt-3 text-sm">{errorMessage}</p>
        )}

        <AlertDialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <AlertDialogCancel disabled={isPending} onClick={onCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {t('chats.info.confirmLeave.confirmLabel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
