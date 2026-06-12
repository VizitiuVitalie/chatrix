import { Check, CheckCheck, LogOut, Trash2, Users } from 'lucide-react';
import { memo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { canLeaveGroup } from '@/modules/chat-members/helpers/can-perform-member-action.helper';
import { formatActivity } from '@/modules/realtime/helpers/format-activity.helper';
import { useChatActivityRecords } from '@/modules/realtime/hooks/use-chat-activity-records';
import { initials } from '@/shared/helpers/initials.helper';
import { formatChatListTime } from '@/shared/helpers/date.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';
import { CheckCheckGroupIcon } from '@/shared/ui/check-check-group-icon';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

import { displayChat } from '../helpers/display-chat.helper';
import { getCurrentUserRole } from '../helpers/get-current-user-role.helper';
import { getLastMessageTickVariant } from '../helpers/get-last-message-tick-variant.helper';
import { isUnreadForUser } from '../helpers/is-unread-for-user.helper';
import type { Chat } from '../interfaces/chat.interface';
import type { ChatListRowProps } from '../interfaces/chat-list-row-props.interface';

function ChatListRowComponent({
  chat,
  currentUserId,
  now,
  onRequestDelete,
  onRequestLeave,
}: ChatListRowProps): ReactElement {
  const { i18n, t } = useTranslation();
  const display = displayChat(chat, currentUserId);

  const activityIso = chat.lastMessage?.createdAt ?? chat.updatedAt;
  const activityDate = new Date(activityIso);
  const timeLabel = formatChatListTime(activityDate, now, i18n.language);

  const activityRecords = useChatActivityRecords(chat.id);
  const activityNameByUserId = new Map(
    chat.members.map((m) => [
      m.user.id,
      m.user.nickname.length > 0 ? m.user.nickname : m.user.username,
    ]),
  );
  const activityLabel = formatActivity(
    activityRecords,
    display.isGroup,
    activityNameByUserId,
    t,
  );
  const preview = activityLabel ?? formatPreview(chat, t);
  const isUnread = isUnreadForUser(chat, currentUserId);
  const lastTickVariant = getLastMessageTickVariant(chat, currentUserId);

  const currentRole = getCurrentUserRole(chat, currentUserId);
  const isDirect = chat.type === 'direct';
  const canDelete = isDirect || currentRole === 'owner';
  const canLeave = !isDirect && canLeaveGroup(currentRole);

  const rowContent: ReactElement = (
    <NavLink
      to={`/chats/${chat.id}`}
      draggable={false}
      className="focus-visible:ring-ring/40 hover:bg-secondary/80 aria-[current=page]:bg-secondary flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2"
    >
      <AvatarWithPresence
        key={display.avatarUrl ?? 'no-avatar'}
        className="h-10 w-10"
        isOnline={display.isOnline}
      >
        {display.avatarUrl !== null && (
          <AvatarImage src={display.avatarUrl} alt={display.name} />
        )}
        {display.isGroup ? (
          <AvatarFallback className="bg-accent/60 text-foreground">
            <Users className="h-5 w-5" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {display.name.length > 0 ? initials(display.name) : '?'}
          </AvatarFallback>
        )}
      </AvatarWithPresence>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-foreground truncate text-sm ${
              isUnread ? 'font-bold' : 'font-semibold'
            }`}
          >
            {display.name}
          </span>
          <span
            className={`flex shrink-0 items-center gap-1 text-xs ${
              isUnread ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}
          >
            {lastTickVariant === 'two-blue-with-group' && (
              <CheckCheckGroupIcon className="text-primary h-3 w-4" />
            )}
            {lastTickVariant === 'two-blue' && (
              <CheckCheck className="text-primary h-3 w-3" />
            )}
            {lastTickVariant === 'sent' && (
              <Check className="text-muted-foreground h-3 w-3" />
            )}
            {timeLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm ${
              activityLabel !== null
                ? 'text-primary'
                : isUnread
                  ? 'text-foreground'
                  : 'text-muted-foreground'
            }`}
          >
            {preview}
          </span>
          {isUnread && (
            <span
              aria-label="unread"
              className="bg-primary inline-block h-2 w-2 shrink-0 rounded-full"
            />
          )}
        </div>
      </div>
    </NavLink>
  );

  if (!canDelete && !canLeave) {
    return rowContent;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block w-full">
        {rowContent}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {canDelete ? (
          <ContextMenuItem
            variant="destructive"
            onSelect={() => {
              onRequestDelete(chat);
            }}
          >
            <Trash2 />
            {isDirect
              ? t('chats.rowMenu.deleteDirect')
              : t('chats.rowMenu.deleteGroup')}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            variant="destructive"
            onSelect={() => {
              onRequestLeave(chat);
            }}
          >
            <LogOut />
            {t('chats.rowMenu.leaveGroup')}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function formatPreview(chat: Chat, t: (key: string) => string): string {
  const lm = chat.lastMessage;
  if (lm === null) return '—';
  const body = lm.content !== null ? lm.content : t('chats.attachmentOnly');

  if (chat.type === 'group') {
    const senderLabel = lm.senderNickname.length > 0 ? lm.senderNickname : '…';
    return `${senderLabel}: ${body}`;
  }

  return body;
}

export const ChatListRow = memo(ChatListRowComponent);
