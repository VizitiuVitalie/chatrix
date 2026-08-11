import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useAttachmentUploads } from '@/modules/files/hooks/use-attachment-uploads';
import { Composer } from '@/modules/messages/components/composer';
import {
  ConversationHeader,
  ConversationHeaderContent,
} from '@/modules/messages/components/conversation-header';
import { useBackGestureClose } from '@/shared/hooks/use-back-gesture-close';
import { primeIosKeyboardViewportForFocusHandoff } from '@/shared/hooks/use-ios-keyboard-viewport';
import { useIsLg } from '@/shared/hooks/use-is-lg';

import { IosConversationShell } from './ios-conversation-shell';
import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';
import type { DraftConversationViewProps } from '../interfaces/draft-conversation-view-props.interface';
import {
  IOS_DRAFT_CONVERSATION_OPEN_CLASS,
  IS_IOS,
  KEYBOARD_HANDOFF_ATTRIBUTE,
  KEYBOARD_HANDOFF_COMPOSER,
} from '../constants/chats.constants';

export function DraftConversationView({
  peer,
  currentUser,
}: DraftConversationViewProps): ReactElement {
  const { t } = useTranslation();
  const attachments = useAttachmentUploads();
  const {
    cancelDraft,
    openDraftPeerInfo,
    isDraftPeerInfoOpen,
    closeDraftPeerInfo,
  } = useChatsLayoutContext();
  const [actionError, setActionError] = useState<string | null>(null);
  const isLg = useIsLg();

  useEffect(() => {
    if (actionError === null) return;
    const timeoutId = window.setTimeout(() => {
      setActionError(null);
    }, 4000);
    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [actionError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;

      const overlay = document.querySelector(
        '[data-state="open"][role="dialog"]',
      );
      if (overlay !== null) return;
      if (isDraftPeerInfoOpen) {
        closeDraftPeerInfo();
        return;
      }
      cancelDraft();
    };
    document.addEventListener('keydown', handleKeyDown);
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelDraft, isDraftPeerInfoOpen, closeDraftPeerInfo]);

  useBackGestureClose(true, cancelDraft, 'chatrixDraftOpen');

  const avatarUrl = peer.thumbnailUrl ?? peer.avatarUrl;
  const useIosShell = IS_IOS && !isLg;
  const HeaderComponent = useIosShell
    ? ConversationHeaderContent
    : ConversationHeader;

  useLayoutEffect(() => {
    if (!useIosShell) return undefined;
    document.documentElement.classList.add(IOS_DRAFT_CONVERSATION_OPEN_CLASS);
    return (): void => {
      document.documentElement.classList.remove(
        IOS_DRAFT_CONVERSATION_OPEN_CLASS,
      );
    };
  }, [useIosShell]);

  useLayoutEffect(() => {
    if (!useIosShell) return;
    if (
      document.documentElement.getAttribute(KEYBOARD_HANDOFF_ATTRIBUTE) !==
      KEYBOARD_HANDOFF_COMPOSER
    ) {
      return;
    }
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-composer-textarea]',
    );
    if (textarea === null) return;
    primeIosKeyboardViewportForFocusHandoff();
    textarea.focus({ preventScroll: true });
    document.documentElement.removeAttribute(KEYBOARD_HANDOFF_ATTRIBUTE);
  }, [useIosShell]);

  const handlePagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (isLg) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-composer-textarea]') !== null) return;
      event.preventDefault();
    },
    [isLg],
  );

  const noopDragHandler = useCallback(
    (_event: DragEvent<HTMLDivElement>): void => undefined,
    [],
  );

  const headerNode = (
    <HeaderComponent
      name={peer.nickname}
      avatarUrl={avatarUrl}
      isGroup={false}
      isOnline={peer.isOnline}
      onBack={cancelDraft}
      onTitleClick={openDraftPeerInfo}
    />
  );

  const listNode = (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <p className="text-muted-foreground max-w-xs text-center text-sm">
        {t('chats.newChatDialog.draftEmpty', { name: peer.nickname })}
      </p>
    </div>
  );

  const actionErrorNode =
    actionError !== null ? (
      <div className="bg-destructive/10 text-destructive border-destructive/30 mx-3 mb-2 rounded-xl border px-3 py-1.5 text-xs">
        {actionError}
      </div>
    ) : null;

  const composerNode = (
    <>
      {actionErrorNode}
      <Composer
        target={{ kind: 'draft', peerUserId: peer.id }}
        currentUser={currentUser}
        editingMessage={null}
        onCancelEdit={() => undefined}
        attachments={attachments}
        onMutationError={setActionError}
        suppressViewportBlur={useIosShell}
      />
    </>
  );

  if (useIosShell) {
    return (
      <IosConversationShell
        onPointerDown={handlePagePointerDown}
        onDragEnter={noopDragHandler}
        onDragLeave={noopDragHandler}
        onDragOver={noopDragHandler}
        onDrop={noopDragHandler}
        keyboardViewportEnabled={!isDraftPeerInfoOpen}
        header={headerNode}
        list={listNode}
        composer={composerNode}
        overlays={null}
      />
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {headerNode}
      {listNode}
      {composerNode}
    </div>
  );
}
