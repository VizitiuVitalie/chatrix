import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';

import type { User } from '@/modules/auth/interfaces/user.interface';
import { ChatActivityProvider } from '@/modules/realtime/context/chat-activity-provider';
import { useRealtimeChats } from '@/modules/realtime/hooks/use-realtime-chats';
import { useBackGestureClose } from '@/shared/hooks/use-back-gesture-close';
import { useIsLg } from '@/shared/hooks/use-is-lg';

import { ChatInfoPane } from '../components/chat-info-pane';
import { ChatListPane } from '../components/chat-list-pane';
import { DraftPeerInfoPane } from '../components/draft-peer-info-pane';
import { NewChatDialog } from '../components/new-chat-dialog';
import { NewChatFab } from '../components/new-chat-fab';
import { ChatsLayoutContext } from '../context/chats-layout-context';
import type { ChatsLayoutContextValue } from '../interfaces/chats-layout-context-value.interface';
import type { NewChatMode } from '../interfaces/new-chat-mode.type';

export function ChatsLayout(): ReactElement {
  const detailMatch = useMatch('/chats/:id');
  const isDetailRoute = Boolean(detailMatch);
  const detailIdNumber = detailMatch?.params.id
    ? Number(detailMatch.params.id)
    : null;
  const navigate = useNavigate();
  const location = useLocation();
  const isLg = useIsLg();
  const previousPathRef = useRef<string>(location.pathname);
  const [newChatMode, setNewChatMode] = useState<NewChatMode>(null);
  const [draftPeer, setDraftPeer] = useState<User | null>(null);
  const [infoPaneChatId, setInfoPaneChatId] = useState<number | null>(null);
  const isInfoPaneOpen =
    detailIdNumber !== null && infoPaneChatId === detailIdNumber;

  const [infoPaneMemberUserId, setInfoPaneMemberUserId] = useState<
    number | null
  >(null);
  const effectiveMemberUserId = isInfoPaneOpen ? infoPaneMemberUserId : null;

  const [draftPeerInfoRequested, setDraftPeerInfoRequested] =
    useState<boolean>(false);
  const isDraftPeerInfoOpen = draftPeer !== null && draftPeerInfoRequested;

  useRealtimeChats();

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const nextPath = location.pathname;
    previousPathRef.current = nextPath;
    if (
      previousPath === '/chats' &&
      nextPath !== '/chats' &&
      nextPath.startsWith('/chats/') &&
      draftPeer !== null
    ) {
      setDraftPeer(null);
      setDraftPeerInfoRequested(false);
    }
  }, [location.pathname, draftPeer]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (detailIdNumber === null) {
      if (infoPaneChatId === null && infoPaneMemberUserId === null) return;
      setInfoPaneChatId(null);
      setInfoPaneMemberUserId(null);
      return;
    }

    if (infoPaneMemberUserId !== null && infoPaneChatId !== detailIdNumber) {
      setInfoPaneMemberUserId(null);
    }
  }, [detailIdNumber, infoPaneChatId, infoPaneMemberUserId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openNewChat = useCallback((mode: 'direct' | 'group'): void => {
    setNewChatMode(mode);
  }, []);
  const closeNewChat = useCallback((): void => {
    setNewChatMode(null);
  }, []);
  const startDraft = useCallback(
    (peer: User): void => {
      void navigate('/chats', { flushSync: true });
      setDraftPeer(peer);
      setNewChatMode(null);
      setDraftPeerInfoRequested(false);
    },
    [navigate],
  );
  const cancelDraft = useCallback((): void => {
    setDraftPeer(null);
    setDraftPeerInfoRequested(false);
  }, []);
  const openInfoPane = useCallback((): void => {
    if (detailIdNumber === null) return;
    setInfoPaneChatId(detailIdNumber);
    setInfoPaneMemberUserId(null);
  }, [detailIdNumber]);
  const closeInfoPane = useCallback((): void => {
    setInfoPaneChatId(null);
    setInfoPaneMemberUserId(null);
  }, []);
  const openMemberProfile = useCallback((userId: number): void => {
    setInfoPaneMemberUserId(userId);
  }, []);
  const closeMemberProfile = useCallback((): void => {
    setInfoPaneMemberUserId(null);
  }, []);

  useBackGestureClose(
    !isLg && isInfoPaneOpen,
    closeInfoPane,
    'chatrixInfoPaneOpen',
  );
  useBackGestureClose(
    !isLg && effectiveMemberUserId !== null,
    closeMemberProfile,
    'chatrixInfoMemberOpen',
  );
  const openDraftPeerInfo = useCallback((): void => {
    setDraftPeerInfoRequested(true);
  }, []);
  const closeDraftPeerInfo = useCallback((): void => {
    setDraftPeerInfoRequested(false);
  }, []);

  const value = useMemo<ChatsLayoutContextValue>(
    () => ({
      newChatMode,
      openNewChat,
      closeNewChat,
      draftPeer,
      startDraft,
      cancelDraft,
      isInfoPaneOpen,
      openInfoPane,
      closeInfoPane,
      infoPaneMemberUserId: effectiveMemberUserId,
      openMemberProfile,
      closeMemberProfile,
      isDraftPeerInfoOpen,
      openDraftPeerInfo,
      closeDraftPeerInfo,
    }),
    [
      newChatMode,
      openNewChat,
      closeNewChat,
      draftPeer,
      startDraft,
      cancelDraft,
      isInfoPaneOpen,
      openInfoPane,
      closeInfoPane,
      effectiveMemberUserId,
      openMemberProfile,
      closeMemberProfile,
      isDraftPeerInfoOpen,
      openDraftPeerInfo,
      closeDraftPeerInfo,
    ],
  );

  const isInfoVisible =
    (isInfoPaneOpen && isDetailRoute) ||
    (isDraftPeerInfoOpen && draftPeer !== null);
  const isMainVisible = (isDetailRoute || draftPeer !== null) && !isInfoVisible;

  return (
    <ChatsLayoutContext.Provider value={value}>
      <ChatActivityProvider>
        <div className="flex min-h-0 w-full flex-1">
          <aside
            className={`bg-card border-border group relative w-full shrink-0 flex-col border-r lg:w-[340px] lg:flex ${
              isMainVisible || isInfoVisible ? 'hidden' : 'flex'
            }`}
          >
            <ChatListPane />
            <NewChatFab />
          </aside>
          <main
            className={`bg-background min-w-0 flex-1 flex-col lg:flex ${
              isMainVisible ? 'flex' : 'hidden'
            }`}
          >
            <Outlet />
          </main>
          {isInfoVisible && (
            <aside className="bg-card border-border flex w-full shrink-0 flex-col border-l lg:w-[360px]">
              {isDraftPeerInfoOpen && draftPeer !== null ? (
                <DraftPeerInfoPane
                  peer={draftPeer}
                  onClose={closeDraftPeerInfo}
                />
              ) : (
                <ChatInfoPane />
              )}
            </aside>
          )}
        </div>
        <NewChatDialog mode={newChatMode} onClose={closeNewChat} />
      </ChatActivityProvider>
    </ChatsLayoutContext.Provider>
  );
}
