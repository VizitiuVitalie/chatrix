import type { ReactElement } from 'react';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/modules/auth/context/auth-provider';
import { AppUpdateBanner } from '@/modules/pwa/components/app-update-banner';
import { InstallPromptProvider } from '@/modules/pwa/context/install-prompt-provider';
import { ThemeProvider } from '@/modules/users/context/theme-provider';
import { usePageZoomLock } from '@/shared/hooks/use-page-zoom-lock';

import { QueryProvider } from './providers/query-provider';
import { router } from './router';

export function App(): ReactElement {
  usePageZoomLock();

  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <InstallPromptProvider>
            <RouterProvider router={router} />
            <AppUpdateBanner />
          </InstallPromptProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
