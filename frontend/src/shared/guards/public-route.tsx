import type { PropsWithChildren, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';

export function PublicRoute({ children }: PropsWithChildren): ReactElement {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
}
