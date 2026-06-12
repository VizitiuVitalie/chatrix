import {
  ArrowUpCircle,
  ArrowDownCircle,
  Crown,
  Loader2,
  MoreVertical,
  UserMinus,
} from 'lucide-react';
import { useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { canPerformMemberAction } from '@/modules/chat-members/helpers/can-perform-member-action.helper';
import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { userAvatarAsFile } from '@/modules/users/helpers/user-avatar-as-file.helper';
import { PRESENCE_TICK_MS } from '@/shared/constants/presence.constants';
import { formatLastSeen } from '@/shared/helpers/date.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { useNowTick } from '@/shared/hooks/use-now-tick';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import type {
  ChatInfoMemberAction,
  ChatInfoMemberRowProps,
} from '../interfaces/chat-info-member-row-props.interface';

export function ChatInfoMemberRow({
  member,
  isSelf,
  viewerRole,
  isPending,
  onAction,
  onSelect,
}: ChatInfoMemberRowProps): ReactElement {
  const { t, i18n } = useTranslation();
  const now = useNowTick(PRESENCE_TICK_MS);
  const user = member.user;
  const displayName = user.nickname.length > 0 ? user.nickname : user.username;

  let presenceSubtitle: string | null = null;
  if (!isSelf) {
    if (user.isOnline) {
      presenceSubtitle = t('presence.online');
    } else if (user.lastSeenAt !== null && user.lastSeenAt !== '') {
      presenceSubtitle = formatLastSeen(
        new Date(user.lastSeenAt),
        now,
        i18n.language,
        t,
      );
    }
  }
  const { openViewer } = useAttachmentViewer();
  const canViewAvatar = user.avatarUrl !== null;
  const openAvatarViewer = (): void => {
    if (!canViewAvatar) return;
    openViewer(userAvatarAsFile(user));
  };
  const swallowRowClickRef = useRef(false);

  const handleRowSelect = (): void => {
    if (swallowRowClickRef.current) {
      swallowRowClickRef.current = false;
      return;
    }
    onSelect(member);
  };

  const runAction = (action: ChatInfoMemberAction): void => {
    swallowRowClickRef.current = true;
    window.setTimeout(() => {
      swallowRowClickRef.current = false;
    }, 400);
    onAction(action, member);
  };

  const canPromote = canPerformMemberAction('promote-admin', {
    viewerRole,
    targetRole: member.role,
    isSelf,
  });
  const canDemote = canPerformMemberAction('demote-member', {
    viewerRole,
    targetRole: member.role,
    isSelf,
  });
  const canTransfer = canPerformMemberAction('transfer-ownership', {
    viewerRole,
    targetRole: member.role,
    isSelf,
  });
  const canKick = canPerformMemberAction('kick', {
    viewerRole,
    targetRole: member.role,
    isSelf,
  });

  const hasAnyAction = canPromote || canDemote || canTransfer || canKick;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleRowSelect();
        }
      }}
      className="group/member hover:bg-secondary flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {canViewAvatar ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openAvatarViewer();
          }}
          aria-label={t('chats.info.viewAvatar')}
          className="inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AvatarWithPresence
            key={user.avatarUrl ?? 'no-avatar'}
            className="h-10 w-10"
            isOnline={user.isOnline}
          >
            {user.avatarUrl !== null && (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
              {initials(displayName) || '?'}
            </AvatarFallback>
          </AvatarWithPresence>
        </button>
      ) : (
        <AvatarWithPresence
          key={user.avatarUrl ?? 'no-avatar'}
          className="h-10 w-10"
          isOnline={user.isOnline}
        >
          {user.avatarUrl !== null && (
            <AvatarImage src={user.avatarUrl} alt={displayName} />
          )}
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {initials(displayName) || '?'}
          </AvatarFallback>
        </AvatarWithPresence>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-semibold">
            {displayName}
          </span>
          {isSelf && (
            <span className="text-muted-foreground text-xs">
              {t('chats.info.youSuffix')}
            </span>
          )}
        </div>
        <p
          className={`truncate text-xs ${
            presenceSubtitle !== null && user.isOnline
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          {presenceSubtitle ?? `@${user.username}`}
        </p>
      </div>

      {member.role !== 'member' && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            member.role === 'owner'
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {t(`chats.info.role.${member.role}`)}
        </span>
      )}

      {/* Always reserve the kebab slot so the role badge column lines
          up regardless of whether THIS row has actions available.
          Without the placeholder, owner rows (no actions) push the
          badge further right than admin rows (with actions), and
          the column wobbles by the kebab's width. */}
      {!hasAnyAction && <span aria-hidden className="h-8 w-8 shrink-0" />}
      {hasAnyAction && (
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            disabled={isPending}
            onClick={(event) => {
              event.stopPropagation();
            }}
            aria-label={t('chats.info.actions.menuLabel')}
            className="text-muted-foreground hover:bg-card hover:text-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-hover/member:opacity-100 [@media(hover:none)]:opacity-100 data-[state=open]:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {canPromote && (
              <DropdownMenuItem
                onClick={() => {
                  runAction('promote');
                }}
              >
                <ArrowUpCircle className="h-4 w-4" />
                {t('chats.info.actions.promoteToAdmin')}
              </DropdownMenuItem>
            )}
            {canDemote && (
              <DropdownMenuItem
                onClick={() => {
                  runAction('demote');
                }}
              >
                <ArrowDownCircle className="h-4 w-4" />
                {t('chats.info.actions.demoteToMember')}
              </DropdownMenuItem>
            )}
            {canTransfer && (
              <DropdownMenuItem
                onClick={() => {
                  runAction('transfer');
                }}
              >
                <Crown className="h-4 w-4" />
                {t('chats.info.actions.transferOwnership')}
              </DropdownMenuItem>
            )}
            {canKick && (
              <>
                {(canPromote || canDemote || canTransfer) && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    runAction('kick');
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                  {t('chats.info.actions.removeFromGroup')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
