import { LogOut, UserPlus } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useRemoveChatMemberMutation } from '@/modules/chat-members/hooks/use-remove-chat-member-mutation';
import { useUpdateChatMemberRoleMutation } from '@/modules/chat-members/hooks/use-update-chat-member-role-mutation';
import { canAddMembers } from '@/modules/chat-members/helpers/can-perform-member-action.helper';
import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { chatAvatarAsFile } from '@/modules/users/helpers/chat-avatar-as-file.helper';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
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
import { getCurrentUserRole } from '../helpers/get-current-user-role.helper';
import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';
import type { ChatInfoViewProps } from '../interfaces/chat-info-view-props.interface';
import type { ChatMember } from '../interfaces/chat-member.interface';
import type { ChatInfoMemberAction } from '../interfaces/chat-info-member-row-props.interface';
import type { PendingMemberConfirm } from '../interfaces/pending-member-confirm.type';
import { ChatAvatarHeroEditor } from './chat-avatar-hero-editor';
import { ChatInfoAddMemberDialog } from './chat-info-add-member-dialog';
import { ChatInfoGroupRename } from './chat-info-group-rename';
import { ChatInfoMemberRow } from './chat-info-member-row';
import { ChatInfoOwnerLeaveDialog } from './chat-info-owner-leave-dialog';

export function ChatInfoGroup({
  chat,
  currentUserId,
}: ChatInfoViewProps): ReactElement {
  const { t } = useTranslation();
  const display = displayChat(chat, currentUserId);
  const viewerRole = getCurrentUserRole(chat, currentUserId);
  const { openViewer } = useAttachmentViewer();
  const canRename = viewerRole === 'owner';
  const canAdd = canAddMembers(viewerRole);
  const showLeaveFooter = viewerRole !== null;
  const isOwner = viewerRole === 'owner';

  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [isOwnerLeaveOpen, setIsOwnerLeaveOpen] = useState<boolean>(false);
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingMemberConfirm | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const updateRoleMutation = useUpdateChatMemberRoleMutation();
  const removeMutation = useRemoveChatMemberMutation(currentUserId);
  const { mutate: mutateRole, isPending: isRolePending } = updateRoleMutation;
  const { mutate: mutateRemove, isPending: isRemovePending } = removeMutation;
  const { openMemberProfile } = useChatsLayoutContext();
  const handleMemberSelect = useCallback(
    (member: ChatMember): void => {
      openMemberProfile(member.user.id);
    },
    [openMemberProfile],
  );

  const [rolePendingMemberId, setRolePendingMemberId] = useState<number | null>(
    null,
  );
  const [removePendingMemberId, setRemovePendingMemberId] = useState<
    number | null
  >(null);

  const sortedMembers = useMemo(() => {
    const rolePriority = { owner: 0, admin: 1, member: 2 } as const;
    return [...chat.members].sort((a, b) => {
      const diff = rolePriority[a.role] - rolePriority[b.role];
      if (diff !== 0) return diff;
      return a.id - b.id;
    });
  }, [chat.members]);

  const selfMember = useMemo(
    () => chat.members.find((m) => m.user.id === currentUserId) ?? null,
    [chat.members, currentUserId],
  );

  const handleMemberAction = useCallback(
    (action: ChatInfoMemberAction, member: ChatMember): void => {
      if (action === 'promote') {
        setRolePendingMemberId(member.id);
        mutateRole(
          { memberId: member.id, chatId: chat.id, role: 'admin' },
          {
            onSettled: () => {
              setRolePendingMemberId(null);
            },
          },
        );
        return;
      }
      if (action === 'demote') {
        setRolePendingMemberId(member.id);
        mutateRole(
          { memberId: member.id, chatId: chat.id, role: 'member' },
          {
            onSettled: () => {
              setRolePendingMemberId(null);
            },
          },
        );
        return;
      }
      if (action === 'transfer') {
        setConfirmError(null);
        setPendingConfirm({ kind: 'transfer', member });
        return;
      }
      setConfirmError(null);
      setPendingConfirm({ kind: 'kick', member });
    },
    [chat.id, mutateRole],
  );

  const handleLeaveClick = useCallback((): void => {
    if (!selfMember) return;
    if (isOwner) {
      setIsOwnerLeaveOpen(true);
      return;
    }
    setConfirmError(null);
    setPendingConfirm({ kind: 'leave', member: selfMember });
  }, [isOwner, selfMember]);

  const closeConfirm = useCallback((): void => {
    setPendingConfirm(null);
    setConfirmError(null);
  }, []);

  const confirmCopy = useMemo(() => {
    if (!pendingConfirm) return null;
    const { kind, member } = pendingConfirm;
    const memberName =
      member.user.nickname.length > 0
        ? member.user.nickname
        : member.user.username;
    if (kind === 'kick') {
      return {
        title: t('chats.info.confirmKick.title', { name: memberName }),
        description: t('chats.info.confirmKick.description', {
          name: memberName,
        }),
        actionLabel: t('chats.info.confirmKick.confirmLabel'),
      };
    }
    if (kind === 'transfer') {
      return {
        title: t('chats.info.confirmTransfer.title', { name: memberName }),
        description: t('chats.info.confirmTransfer.description', {
          name: memberName,
        }),
        actionLabel: t('chats.info.confirmTransfer.confirmLabel'),
      };
    }
    return {
      title: t('chats.info.confirmLeave.title'),
      description: t('chats.info.confirmLeave.description'),
      actionLabel: t('chats.info.confirmLeave.confirmLabel'),
    };
  }, [pendingConfirm, t]);

  const handleConfirmAction = useCallback((): void => {
    if (!pendingConfirm) return;
    const { kind, member } = pendingConfirm;
    setConfirmError(null);

    if (kind === 'kick') {
      setRemovePendingMemberId(member.id);
      mutateRemove(
        { memberId: member.id, chatId: chat.id },
        {
          onSuccess: () => {
            closeConfirm();
          },
          onError: (error) => {
            setConfirmError(getErrorMessage(error));
          },
          onSettled: () => {
            setRemovePendingMemberId(null);
          },
        },
      );
      return;
    }
    if (kind === 'transfer') {
      setRolePendingMemberId(member.id);
      mutateRole(
        { memberId: member.id, chatId: chat.id, role: 'owner' },
        {
          onSuccess: () => {
            closeConfirm();
          },
          onError: (error) => {
            setConfirmError(getErrorMessage(error));
          },
          onSettled: () => {
            setRolePendingMemberId(null);
          },
        },
      );
      return;
    }
    setRemovePendingMemberId(member.id);
    mutateRemove(
      { memberId: member.id, chatId: chat.id },
      {
        onSuccess: () => {
          closeConfirm();
        },
        onError: (error) => {
          setConfirmError(getErrorMessage(error));
        },
        onSettled: () => {
          setRemovePendingMemberId(null);
        },
      },
    );
  }, [chat.id, closeConfirm, mutateRemove, mutateRole, pendingConfirm]);

  const isConfirmPending =
    (pendingConfirm?.kind === 'transfer' && isRolePending) ||
    ((pendingConfirm?.kind === 'kick' || pendingConfirm?.kind === 'leave') &&
      isRemovePending);

  return (
    <>
      <section className="flex flex-col items-center gap-3 p-6">
        <ChatAvatarHeroEditor
          chat={chat}
          chatName={display.name}
          canEdit={isOwner}
          onAvatarClick={() => {
            openViewer(chatAvatarAsFile(chat, display.name));
          }}
        />
        <ChatInfoGroupRename
          chatId={chat.id}
          currentName={display.name}
          canRename={canRename}
        />
        <p className="text-muted-foreground text-sm">
          {t('chats.info.memberCount', { count: chat.members.length })}
        </p>
      </section>

      <section className="border-border border-t p-2">
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            {t('chats.info.membersHeading')}
          </h4>
          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setIsAddMemberOpen(true);
              }}
              className="text-primary hover:bg-primary/10 inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-semibold transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t('chats.info.addMember.button')}
            </button>
          )}
        </div>
        <ul className="space-y-1">
          {sortedMembers.map((member) => {
            const isSelf = member.user.id === currentUserId;
            const isPending =
              member.id === rolePendingMemberId ||
              member.id === removePendingMemberId;
            return (
              <li key={member.id}>
                <ChatInfoMemberRow
                  member={member}
                  isSelf={isSelf}
                  viewerRole={viewerRole}
                  isPending={isPending}
                  onAction={handleMemberAction}
                  onSelect={handleMemberSelect}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {showLeaveFooter && (
        <section className="border-border mt-auto border-t p-4">
          <button
            type="button"
            onClick={handleLeaveClick}
            className="text-destructive hover:bg-destructive/10 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('chats.info.leaveGroup.button')}
          </button>
        </section>
      )}

      <ChatInfoAddMemberDialog
        chat={chat}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
      />

      <ChatInfoOwnerLeaveDialog
        chat={chat}
        currentUserId={currentUserId}
        open={isOwnerLeaveOpen}
        onOpenChange={setIsOwnerLeaveOpen}
      />

      <AlertDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm();
        }}
      >
        <AlertDialogContent>
          {confirmCopy !== null && (
            <>
              <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmCopy.description}
              </AlertDialogDescription>
              {confirmError !== null && (
                <p className="text-destructive mt-3 text-sm">{confirmError}</p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isConfirmPending}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirmAction();
                  }}
                  disabled={isConfirmPending}
                  className={
                    pendingConfirm?.kind === 'transfer'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : ''
                  }
                >
                  {confirmCopy.actionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
