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

import { displayChat } from '../helpers/display-chat.helper';
import type { DeleteChatConfirmDialogProps } from '../interfaces/delete-chat-confirm-dialog-props.interface';

export function DeleteChatConfirmDialog({
  pending,
  currentUserId,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteChatConfirmDialogProps): ReactElement {
  const { t } = useTranslation();

  const display =
    pending !== null ? displayChat(pending.chat, currentUserId) : null;
  const peerName = display?.name ?? '';
  const isDirect = pending === null || pending.chat.type === 'direct';

  const variantKey = isDirect ? 'direct' : 'group';

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>
          {t(`chats.deleteChat.${variantKey}.title`, { name: peerName })}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {t(`chats.deleteChat.${variantKey}.description`, {
            name: peerName,
          })}
        </AlertDialogDescription>

        {errorMessage !== null && (
          <p className="text-destructive mt-3 text-sm">
            {t('chats.deleteChat.error', { reason: errorMessage })}
          </p>
        )}

        <AlertDialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <AlertDialogCancel disabled={isPending} onClick={onCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>

          {isDirect ? (
            <>
              <AlertDialogAction
                disabled={isPending}
                className="bg-secondary text-foreground hover:bg-secondary/80"
                onClick={(event) => {
                  event.preventDefault();
                  onConfirm('me');
                }}
              >
                {t('chats.deleteChat.direct.justForMe')}
              </AlertDialogAction>
              <AlertDialogAction
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  onConfirm('both');
                }}
              >
                {t('chats.deleteChat.direct.forBoth', { name: peerName })}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                onConfirm('both');
              }}
            >
              {t('chats.deleteChat.group.confirm')}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
