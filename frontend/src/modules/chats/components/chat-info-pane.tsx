import { ArrowLeft, X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';
import { useChatsQuery } from '../hooks/use-chats-query';
import { ChatInfoDirect } from './chat-info-direct';
import { ChatInfoGroup } from './chat-info-group';
import { ChatInfoMemberProfile } from './chat-info-member-profile';

export function ChatInfoPane(): ReactElement | null {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const chatId = Number(id);
  const chatsQuery = useChatsQuery();
  const { closeInfoPane, infoPaneMemberUserId, closeMemberProfile } =
    useChatsLayoutContext();

  const chat = chatsQuery.data?.find((c) => c.id === chatId) ?? null;
  const isMemberProfileOpen =
    chat !== null && chat.type === 'group' && infoPaneMemberUserId !== null;

  if (!user || !chat) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="border-border bg-card flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6">
          <h2 className="text-foreground text-base font-semibold">
            {t('chats.info.title')}
          </h2>
          <button
            type="button"
            aria-label={t('common.cancel')}
            onClick={closeInfoPane}
            className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
          {t('chat.notFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border bg-card flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {isMemberProfileOpen && (
            <button
              type="button"
              aria-label={t('chats.info.memberProfile.back')}
              onClick={closeMemberProfile}
              className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-foreground truncate text-base font-semibold">
            {isMemberProfileOpen
              ? t('chats.info.memberProfile.title')
              : chat.type === 'group'
                ? t('chats.info.titleGroup')
                : t('chats.info.titleDirect')}
          </h2>
        </div>
        <button
          type="button"
          aria-label={t('common.cancel')}
          onClick={closeInfoPane}
          className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {isMemberProfileOpen && infoPaneMemberUserId !== null ? (
          <ChatInfoMemberProfile chat={chat} userId={infoPaneMemberUserId} />
        ) : chat.type === 'group' ? (
          <ChatInfoGroup chat={chat} currentUserId={user.id} />
        ) : (
          <ChatInfoDirect chat={chat} currentUserId={user.id} />
        )}
      </div>
    </div>
  );
}
