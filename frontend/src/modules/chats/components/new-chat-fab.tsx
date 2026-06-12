import { MessageSquarePlus, Pencil, Users, X } from 'lucide-react';
import { useCallback, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';

export function NewChatFab(): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);
  const { openNewChat } = useChatsLayoutContext();

  const openDirect = useCallback((): void => {
    openNewChat('direct');
  }, [openNewChat]);
  const openGroup = useCallback((): void => {
    openNewChat('group');
  }, [openNewChat]);

  const visibilityClass = open
    ? 'opacity-100'
    : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('chats.newChat')}
          className={`bg-primary text-primary-foreground hover:bg-primary/90 absolute right-5 bottom-5 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-opacity duration-200 ease-out ${visibilityClass}`}
        >
          <span className="relative inline-flex h-5 w-5">
            <Pencil
              aria-hidden
              className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-out ${
                open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
              }`}
            />
            <X
              aria-hidden
              className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-out ${
                open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
              }`}
            />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        {/* `onSelect` is the Radix-native event for menu items, but
            when the same component is mounted next to a Dialog the
            onSelect → onOpenChange race occasionally swallows the
            state update in dev. `onClick` fires on every confirmed
            pointer activation and Radix still auto-closes the menu
            after a non-preventDefault'd click. */}
        <DropdownMenuItem onSelect={openDirect} onClick={openDirect}>
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm font-medium">{t('chats.fab.newChat')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openGroup} onClick={openGroup}>
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{t('chats.fab.newGroup')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
