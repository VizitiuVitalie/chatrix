import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import type { PropsWithChildren, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function AccountMenu({ children }: PropsWithChildren): ReactElement {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
  }

  function clearActiveFocus(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            clearActiveFocus();
            navigate('/profile');
          }}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          {t('account.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            clearActiveFocus();
            navigate('/settings');
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          {t('account.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            clearActiveFocus();
            void handleLogout();
          }}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('common.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
