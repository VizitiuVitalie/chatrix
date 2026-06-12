import { MessageCircle, Search } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useRemoveChatMemberMutation } from '@/modules/chat-members/hooks/use-remove-chat-member-mutation';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { LoadErrorState } from '@/shared/components/load-error-state';

import { displayChat } from '../helpers/display-chat.helper';
import { isUnreadForUser } from '../helpers/is-unread-for-user.helper';
import { useChatsQuery } from '../hooks/use-chats-query';
import { useDeleteChatMutation } from '../hooks/use-delete-chat-mutation';
import type { Chat } from '../interfaces/chat.interface';
import type { ChatTab } from '../interfaces/chat-tab.type';
import type { DeleteChatScope } from '../interfaces/delete-chat-scope.type';
import type { PendingChatDeletion } from '../interfaces/delete-chat-confirm-dialog-props.interface';
import type { PendingChatLeave } from '../interfaces/leave-group-confirm-dialog-props.interface';
import type { RenderBodyParams } from '../interfaces/render-body-params.interface';
import { ChatListRow } from './chat-list-row';
import { ChatListRowSkeleton } from './chat-list-row-skeleton';
import { DeleteChatConfirmDialog } from './delete-chat-confirm-dialog';
import { LeaveGroupConfirmDialog } from './leave-group-confirm-dialog';
import { CHAT_TABS, SKELETON_ROW_COUNT } from '../constants/chats.constants';

export function ChatListPane(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [searchValue, setSearchValue] = useState<string>('');

  const query = useChatsQuery();
  const deleteMutation = useDeleteChatMutation();
  const deleteMutate = deleteMutation.mutate;
  const leaveMutation = useRemoveChatMemberMutation(user?.id ?? -1);
  const leaveMutate = leaveMutation.mutate;

  const [pending, setPending] = useState<PendingChatDeletion | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleRequestDelete = useCallback((chat: Chat) => {
    setDeleteError(null);
    setPending({ chat });
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPending(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(
    (scope: DeleteChatScope) => {
      if (pending === null || !user) return;
      const { chat } = pending;
      setDeleteError(null);
      deleteMutate(
        { chatId: chat.id, scope, currentUserId: user.id },
        {
          onSuccess: () => {
            setPending(null);
          },
          onError: (error) => {
            setDeleteError(getErrorMessage(error));
          },
        },
      );
    },
    [pending, user, deleteMutate],
  );

  const [pendingLeave, setPendingLeave] = useState<PendingChatLeave | null>(
    null,
  );
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const handleRequestLeave = useCallback((chat: Chat) => {
    setLeaveError(null);
    setPendingLeave({ chat });
  }, []);

  const handleCancelLeave = useCallback(() => {
    setPendingLeave(null);
    setLeaveError(null);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    if (pendingLeave === null || !user) return;
    const { chat } = pendingLeave;
    const selfMember = chat.members.find((m) => m.user.id === user.id);
    if (!selfMember) return;
    setLeaveError(null);
    leaveMutate(
      { memberId: selfMember.id, chatId: chat.id },
      {
        onSuccess: () => {
          setPendingLeave(null);
        },
        onError: (error) => {
          setLeaveError(getErrorMessage(error));
        },
      },
    );
  }, [pendingLeave, user, leaveMutate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [query.data]);

  const visibleChats = useMemo(() => {
    if (!query.data || !user) return [];
    return filterChats(query.data, activeTab, searchValue, user.id);
  }, [query.data, activeTab, searchValue, user]);

  return (
    <>
      <div className="border-border flex h-16 shrink-0 items-center border-b px-4">
        <div className="relative w-full">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            data-chat-list-search
            placeholder={t('chats.search')}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setSearchValue('');
                event.currentTarget.blur();
              }
            }}
            className="bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring focus:bg-card h-10 w-full select-text rounded-xl border-0 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <div
        role="tablist"
        className="border-border flex items-center border-b px-3"
      >
        {CHAT_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(tab);
              }}
              className={`relative px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary after:bg-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`chats.tabs.${tab}`)}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderBody({
          query,
          user,
          visibleChats,
          searchValue,
          now,
          t,
          onRequestDelete: handleRequestDelete,
          onRequestLeave: handleRequestLeave,
        })}
      </div>

      {user !== null && (
        <>
          <DeleteChatConfirmDialog
            pending={pending}
            currentUserId={user.id}
            isPending={deleteMutation.isPending}
            errorMessage={deleteError}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />

          <LeaveGroupConfirmDialog
            pending={pendingLeave}
            isPending={leaveMutation.isPending}
            errorMessage={leaveError}
            onCancel={handleCancelLeave}
            onConfirm={handleConfirmLeave}
          />
        </>
      )}
    </>
  );
}

function renderBody({
  query,
  user,
  visibleChats,
  searchValue,
  now,
  t,
  onRequestDelete,
  onRequestLeave,
}: RenderBodyParams): ReactElement {
  if (query.isPending) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
          <ChatListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <LoadErrorState
        title={t('chats.loadError')}
        description={getErrorMessage(query.error)}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (!user || !query.data || query.data.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="bg-secondary text-primary inline-flex h-12 w-12 items-center justify-center rounded-2xl">
          <MessageCircle className="h-6 w-6" />
        </span>
        <h3 className="text-foreground text-base font-semibold">
          {t('chats.emptyListTitle')}
        </h3>
        <p className="text-muted-foreground max-w-xs text-sm">
          {t('chats.emptyListSubtitle')}
        </p>
      </div>
    );
  }

  if (visibleChats.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center">
        <Search className="h-6 w-6" />
        <p className="text-sm">
          {searchValue.length > 0
            ? t('chats.noSearchResults', { query: searchValue })
            : t('chats.noFilterResults')}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {visibleChats.map((chat) => (
        <li key={chat.id}>
          <ChatListRow
            chat={chat}
            currentUserId={user.id}
            now={now}
            onRequestDelete={onRequestDelete}
            onRequestLeave={onRequestLeave}
          />
        </li>
      ))}
    </ul>
  );
}

function filterChats(
  chats: Chat[],
  tab: ChatTab,
  search: string,
  currentUserId: number,
): Chat[] {
  let filtered = chats;

  if (tab === 'groups') {
    filtered = filtered.filter((c) => c.type === 'group');
  } else if (tab === 'unread') {
    filtered = filtered.filter((c) => isUnreadForUser(c, currentUserId));
  }

  if (search.trim().length > 0) {
    const needle = search.trim().toLowerCase();
    filtered = filtered.filter((c) => {
      const display = displayChat(c, currentUserId);
      return display.name.toLowerCase().includes(needle);
    });
  }

  return filtered;
}
