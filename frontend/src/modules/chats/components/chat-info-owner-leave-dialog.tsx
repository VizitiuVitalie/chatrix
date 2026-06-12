import { Crown, Loader2, Trash2 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteChatMutation } from '../hooks/use-delete-chat-mutation';
import { useRemoveChatMemberMutation } from '@/modules/chat-members/hooks/use-remove-chat-member-mutation';
import { useUpdateChatMemberRoleMutation } from '@/modules/chat-members/hooks/use-update-chat-member-role-mutation';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import type { ChatInfoOwnerLeaveDialogProps } from '../interfaces/chat-info-owner-leave-dialog-props.interface';
import type { ChatMember } from '../interfaces/chat-member.interface';

export function ChatInfoOwnerLeaveDialog({
  chat,
  currentUserId,
  open,
  onOpenChange,
}: ChatInfoOwnerLeaveDialogProps): ReactElement {
  const { t } = useTranslation();
  const [step, setStep] = useState<'choice' | 'pick'>('choice');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const deleteMutation = useDeleteChatMutation();
  const updateRoleMutation = useUpdateChatMemberRoleMutation();
  const removeMutation = useRemoveChatMemberMutation(currentUserId);

  const { mutate: deleteChat, isPending: isDeletePending } = deleteMutation;
  const { mutate: transferOwnership, isPending: isTransferPending } =
    updateRoleMutation;
  const { mutate: leaveAsAdmin, isPending: isLeavePending } = removeMutation;

  const isAnyPending = isDeletePending || isTransferPending || isLeavePending;

  const selfMember = useMemo(
    () => chat.members.find((m) => m.user.id === currentUserId) ?? null,
    [chat.members, currentUserId],
  );

  const candidates = useMemo(() => {
    const rolePriority = { admin: 0, member: 1, owner: 2 } as const;
    return chat.members
      .filter((m) => m.user.id !== currentUserId)
      .sort((a, b) => {
        const diff = rolePriority[a.role] - rolePriority[b.role];
        if (diff !== 0) return diff;
        return a.id - b.id;
      });
  }, [chat.members, currentUserId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setStep('choice');
      setSubmitError(null);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDelete = useCallback((): void => {
    setSubmitError(null);
    deleteChat(
      { chatId: chat.id, scope: 'both', currentUserId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error) => {
          setSubmitError(getErrorMessage(error));
        },
      },
    );
  }, [chat.id, currentUserId, deleteChat, onOpenChange]);

  const handlePickNewOwner = useCallback(
    (target: ChatMember): void => {
      if (!selfMember) return;
      setSubmitError(null);
      transferOwnership(
        { memberId: target.id, chatId: chat.id, role: 'owner' },
        {
          onSuccess: () => {
            leaveAsAdmin(
              { memberId: selfMember.id, chatId: chat.id },
              {
                onSuccess: () => {
                  onOpenChange(false);
                },
                onError: (error) => {
                  setSubmitError(getErrorMessage(error));
                },
              },
            );
          },
          onError: (error) => {
            setSubmitError(getErrorMessage(error));
          },
        },
      );
    },
    [chat.id, leaveAsAdmin, onOpenChange, selfMember, transferOwnership],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isAnyPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="gap-3"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {step === 'choice' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('chats.info.ownerLeave.title')}</DialogTitle>
              <DialogDescription>
                {t('chats.info.ownerLeave.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isAnyPending}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletePending ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5 shrink-0" />
                )}
                <span className="flex-1">
                  <span className="block">
                    {t('chats.info.ownerLeave.deleteOption.label')}
                  </span>
                  <span className="text-muted-foreground block text-xs font-normal">
                    {t('chats.info.ownerLeave.deleteOption.hint')}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('pick');
                }}
                disabled={isAnyPending || candidates.length === 0}
                className="border-border hover:bg-secondary inline-flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Crown className="text-primary h-5 w-5 shrink-0" />
                <span className="flex-1">
                  <span className="text-foreground block">
                    {t('chats.info.ownerLeave.transferOption.label')}
                  </span>
                  <span className="text-muted-foreground block text-xs font-normal">
                    {candidates.length === 0
                      ? t('chats.info.ownerLeave.transferOption.disabledHint')
                      : t('chats.info.ownerLeave.transferOption.hint')}
                  </span>
                </span>
              </button>
            </div>

            {submitError !== null && (
              <p className="text-destructive mt-1 text-sm">{submitError}</p>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('chats.info.ownerLeave.pick.title')}</DialogTitle>
              <DialogDescription>
                {t('chats.info.ownerLeave.pick.description')}
              </DialogDescription>
            </DialogHeader>

            <ul className="max-h-[40vh] space-y-1 overflow-y-auto">
              {candidates.map((member) => {
                const displayName =
                  member.user.nickname.length > 0
                    ? member.user.nickname
                    : member.user.username;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => {
                        handlePickNewOwner(member);
                      }}
                      disabled={isAnyPending}
                      className="hover:bg-secondary flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <AvatarWithPresence
                        className="h-10 w-10"
                        isOnline={member.user.isOnline}
                      >
                        {member.user.avatarUrl !== null && (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={displayName}
                          />
                        )}
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                          {initials(displayName) || '?'}
                        </AvatarFallback>
                      </AvatarWithPresence>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-semibold">
                          {displayName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          @{member.user.username}
                          {member.role === 'admin' &&
                            ` · ${t('chats.info.role.admin')}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {submitError !== null && (
              <p className="text-destructive mt-1 text-sm">{submitError}</p>
            )}

            <div className="mt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep('choice');
                }}
                disabled={isAnyPending}
                className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center rounded-xl px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('common.back')}
              </button>
              {isAnyPending && (
                <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('chats.info.ownerLeave.pick.transferring')}
                </span>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
