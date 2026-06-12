import type { ReactElement } from 'react';
import { Outlet, useMatch } from 'react-router-dom';

import { AttachmentViewerProvider } from '@/modules/files/context/attachment-viewer-provider';
import { usePushAutoSubscribe } from '@/modules/push/hooks/use-push-auto-subscribe';
import { usePushSwMessages } from '@/modules/push/hooks/use-push-sw-messages';
import { RealtimeProvider } from '@/modules/realtime/context/realtime-provider';
import { useGlobalTypeToFocus } from '@/shared/hooks/use-global-type-to-focus';

import { TopActionBar } from './top-action-bar';

export function MainLayout(): ReactElement {
  usePushAutoSubscribe();
  usePushSwMessages();
  useGlobalTypeToFocus();
  const isConversation = Boolean(useMatch('/chats/:id'));

  return (
    <RealtimeProvider>
      <AttachmentViewerProvider>
        <div
          style={{ height: 'var(--app-vh, 100dvh)' }}
          className="bg-background flex select-none flex-col"
        >
          <TopActionBar
            className={isConversation ? 'hidden lg:block' : undefined}
          />
          <main className="flex flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </AttachmentViewerProvider>
    </RealtimeProvider>
  );
}
