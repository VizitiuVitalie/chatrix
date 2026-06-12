import { ChevronDown } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { InstallTopbarBadge } from '@/modules/pwa/components/install-topbar-badge';
import { AccountMenu } from '@/shared/components/account-menu';
import { initials } from '@/shared/helpers/initials.helper';
import { useBackendHealth } from '@/shared/hooks/use-backend-health';
import type { TopActionBarProps } from '@/shared/interfaces/top-action-bar-props.interface';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';
import { BrandLogo } from '@/shared/ui/brand-logo';

export function TopActionBar({ className }: TopActionBarProps): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOnline = useBackendHealth() === 'online';

  return (
    <header
      data-top-action-bar
      className={`bg-card/85 border-border/80 sticky top-0 z-20 shrink-0 border-b pt-[env(safe-area-inset-top)] shadow-[0_4px_16px_oklch(0.28_0.04_270/_0.04)] backdrop-blur-xl ${className ?? ''}`}
    >
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <BrandLogo size={28} className="shrink-0 drop-shadow-sm" />
          <span className="text-foreground text-base font-bold tracking-tight">
            {t('common.appName')}
          </span>
          <InstallTopbarBadge />
        </div>

        <AccountMenu>
          <button
            type="button"
            aria-label={t('account.profile')}
            className="hover:bg-secondary focus-visible:ring-ring/40 flex h-10 shrink-0 items-center gap-2 rounded-full pl-1 pr-2 outline-none transition-colors focus-visible:ring-2"
          >
            <AvatarWithPresence
              className="h-8 w-8"
              isOnline={isOnline}
              dotClassName="lg:hidden"
            >
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt={user?.nickname ?? ''}
              />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                {user ? initials(user.nickname) : '?'}
              </AvatarFallback>
            </AvatarWithPresence>
            <div className="hidden flex-col items-start leading-tight lg:flex">
              <span className="text-foreground text-sm font-semibold">
                {user?.nickname ?? ''}
              </span>
              <span
                className={
                  isOnline
                    ? 'text-[color:var(--color-online)] text-xs font-medium'
                    : 'text-muted-foreground text-xs'
                }
              >
                {isOnline ? t('account.online') : t('account.offline')}
              </span>
            </div>
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          </button>
        </AccountMenu>
      </div>
    </header>
  );
}
