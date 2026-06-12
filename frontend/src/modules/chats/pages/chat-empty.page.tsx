import { MessageCircle, MessageSquarePlus, Plus, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { DraftConversationView } from '../components/draft-conversation-view';
import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';

export function ChatEmptyPage(): ReactElement {
  const { t } = useTranslation();
  const { draftPeer, openNewChat } = useChatsLayoutContext();
  const { user } = useAuth();

  if (draftPeer !== null && user !== null) {
    return <DraftConversationView peer={draftPeer} currentUser={user} />;
  }

  const openDirect = (): void => {
    openNewChat('direct');
  };
  const openGroup = (): void => {
    openNewChat('group');
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <span className="from-primary/15 to-accent/40 ring-border/40 text-primary inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br shadow-sm ring-1">
        <MessageCircle className="h-9 w-9" />
      </span>
      <h2 className="text-foreground text-lg font-semibold">
        {t('chats.noSelection.title')}
      </h2>
      <p className="text-muted-foreground max-w-xs text-center text-sm">
        {t('chats.noSelection.subtitle')}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/40 mt-2 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2"
          >
            <Plus className="h-4 w-4" />
            {t('chats.newChat')}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" sideOffset={6} className="w-56">
          <DropdownMenuItem onSelect={openDirect} onClick={openDirect}>
            <MessageSquarePlus className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t('chats.fab.newChat')}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openGroup} onClick={openGroup}>
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t('chats.fab.newGroup')}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
