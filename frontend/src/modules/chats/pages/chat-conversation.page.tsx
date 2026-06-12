import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { ChatHeaderActionsMenu } from '@/modules/chats/components/chat-header-actions-menu';
import { DeleteChatConfirmDialog } from '@/modules/chats/components/delete-chat-confirm-dialog';
import { IosConversationShell } from '@/modules/chats/components/ios-conversation-shell';
import {
  CHAT_TAP_DISMISS_MAX_MOVE_PX,
  CHAT_TAP_DISMISS_MAX_MS,
  FOCUS_COMPOSER_STATE_KEY,
  IS_IOS,
  KEYBOARD_HANDOFF_ATTRIBUTE,
  KEYBOARD_HANDOFF_COMPOSER,
} from '@/modules/chats/constants/chats.constants';
import { displayChat } from '@/modules/chats/helpers/display-chat.helper';
import { useChatsLayoutContext } from '@/modules/chats/hooks/use-chats-layout-context';
import { useChatsQuery } from '@/modules/chats/hooks/use-chats-query';
import { useDeleteChatMutation } from '@/modules/chats/hooks/use-delete-chat-mutation';
import { useMarkChatReadMutation } from '@/modules/chats/hooks/use-mark-chat-read-mutation';
import type { DeleteChatScope } from '@/modules/chats/interfaces/delete-chat-scope.type';
import {
  MAX_FILES_PER_MESSAGE,
  MAX_UPLOAD_SIZE_BYTES,
} from '@/modules/files/constants/files.constants';
import { useAttachmentUploads } from '@/modules/files/hooks/use-attachment-uploads';
import { Composer } from '@/modules/messages/components/composer';
import {
  ConversationHeader,
  ConversationHeaderContent,
} from '@/modules/messages/components/conversation-header';
import { MessagesList } from '@/modules/messages/components/messages-list';
import { MessagesListSkeleton } from '@/modules/messages/components/messages-list-skeleton';
import { useDeleteMessageMutation } from '@/modules/messages/hooks/use-delete-message-mutation';
import { useMessagesQuery } from '@/modules/messages/hooks/use-messages-query';
import { useSendMessageMutation } from '@/modules/messages/hooks/use-send-message-mutation';
import type { Message } from '@/modules/messages/interfaces/message.interface';
import { formatActivity } from '@/modules/realtime/helpers/format-activity.helper';
import { useChatActivityRecords } from '@/modules/realtime/hooks/use-chat-activity-records';
import { useRealtimeMessages } from '@/modules/realtime/hooks/use-realtime-messages';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { LoadErrorState } from '@/shared/components/load-error-state';
import { primeIosKeyboardViewportForFocusHandoff } from '@/shared/hooks/use-ios-keyboard-viewport';
import { useIsLg } from '@/shared/hooks/use-is-lg';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

export function ChatConversationPage(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const chatId = Number(id);

  const navigate = useNavigate();
  const location = useLocation();
  const chatsQuery = useChatsQuery();
  const chat = chatsQuery.data?.find((c) => c.id === chatId) ?? null;
  const {
    openInfoPane,
    closeInfoPane,
    isInfoPaneOpen,
    infoPaneMemberUserId,
    closeMemberProfile,
  } = useChatsLayoutContext();

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

  const [isDeleteChatOpen, setIsDeleteChatOpen] = useState<boolean>(false);
  const [deleteChatError, setDeleteChatError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    if (actionError === null) return;
    const id = window.setTimeout(() => {
      setActionError(null);
    }, 4000);
    return (): void => {
      window.clearTimeout(id);
    };
  }, [actionError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;
      const hasOpenOverlay =
        document.querySelector(
          '[data-state="open"][role="menu"],[data-state="open"][role="dialog"],[data-state="open"][role="listbox"],[data-state="open"][role="alertdialog"]',
        ) !== null;
      if (hasOpenOverlay) return;

      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        document.activeElement.blur();
      }

      if (isInfoPaneOpen && infoPaneMemberUserId !== null) {
        closeMemberProfile();
        return;
      }
      if (isInfoPaneOpen) {
        closeInfoPane();
        return;
      }
      if (editingMessage !== null) {
        setEditingMessage(null);
        return;
      }
      navigate('/chats');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    navigate,
    editingMessage,
    isInfoPaneOpen,
    closeInfoPane,
    infoPaneMemberUserId,
    closeMemberProfile,
  ]);

  const messagesQuery = useMessagesQuery(chatId);
  useRealtimeMessages(chatId);
  const activityRecords = useChatActivityRecords(chatId);
  const sendMutation = useSendMessageMutation(user!);
  const deleteMutation = useDeleteMessageMutation();
  const deleteChatMutation = useDeleteChatMutation();
  const markReadMutation = useMarkChatReadMutation();
  const attachments = useAttachmentUploads();

  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);
  const isLg = useIsLg();
  const handledFocusHandoffRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const state = location.state as {
      [FOCUS_COMPOSER_STATE_KEY]?: boolean;
    } | null;
    const hasKeyboardHandoff =
      document.documentElement.getAttribute(KEYBOARD_HANDOFF_ATTRIBUTE) ===
      KEYBOARD_HANDOFF_COMPOSER;
    if (state?.[FOCUS_COMPOSER_STATE_KEY] !== true && !hasKeyboardHandoff) {
      return;
    }
    if (isLg) return;
    const handoffKey = `${location.key}:${chatId}`;
    if (handledFocusHandoffRef.current === handoffKey) return;
    handledFocusHandoffRef.current = handoffKey;

    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-composer-textarea]',
    );
    if (textarea === null) return;

    if (IS_IOS) {
      primeIosKeyboardViewportForFocusHandoff();
    }
    textarea.focus({ preventScroll: true });
    const length = textarea.value.length;
    textarea.setSelectionRange(length, length);
    if (hasKeyboardHandoff) {
      document.documentElement.removeAttribute(KEYBOARD_HANDOFF_ATTRIBUTE);
    }
  }, [chatId, isLg, location.key, location.state]);

  const pointerDownRef = useRef<{ time: number; x: number; y: number } | null>(
    null,
  );
  const handlePagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (isLg) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-composer-textarea]') !== null) return;
      if (target.closest('[data-keyboard-dismiss-control]') !== null) return;
      pointerDownRef.current = {
        time: Date.now(),
        x: event.clientX,
        y: event.clientY,
      };
      event.preventDefault();
    },
    [isLg],
  );

  const handlePagePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const down = pointerDownRef.current;
      pointerDownRef.current = null;
      if (isLg || IS_IOS || down === null) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(
          'button, a, input, textarea, select, [role="button"], [role="menuitem"]',
        ) !== null
      ) {
        return;
      }
      const isTap =
        Date.now() - down.time <= CHAT_TAP_DISMISS_MAX_MS &&
        Math.hypot(event.clientX - down.x, event.clientY - down.y) <=
          CHAT_TAP_DISMISS_MAX_MOVE_PX;
      if (!isTap) return;
      const textarea = document.querySelector<HTMLTextAreaElement>(
        '[data-composer-textarea]',
      );
      if (textarea !== null && document.activeElement === textarea) {
        textarea.blur();
      }
    },
    [isLg],
  );

  const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      attachments.addFiles(files);
    }
  };

  useEffect(() => {
    const preventBrowserDefault = (event: Event): void => {
      event.preventDefault();
    };
    document.addEventListener('dragover', preventBrowserDefault);
    document.addEventListener('drop', preventBrowserDefault);
    return (): void => {
      document.removeEventListener('dragover', preventBrowserDefault);
      document.removeEventListener('drop', preventBrowserDefault);
    };
  }, []);

  const sendMutate = sendMutation.mutate;
  const deleteMutate = deleteMutation.mutate;
  const markReadMutate = markReadMutation.mutate;

  const messages = useMemo(() => {
    if (!messagesQuery.data) return [];
    const flat = messagesQuery.data.pages.flatMap((p) => p.items);
    return [...flat].reverse();
  }, [messagesQuery.data]);

  const newestForeignMessageId = useMemo(() => {
    if (messages.length === 0 || !user) return null;
    const tail = messages[messages.length - 1];
    if (tail.senderId === user.id) return null;
    if (tail.status === 'pending' || tail.status === 'failed') return null;
    return tail.id;
  }, [messages, user]);

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(chatId)) return;
    if (newestForeignMessageId === null) return;
    markReadMutate({ chatId, currentUserId: user.id });
  }, [chatId, user, newestForeignMessageId, markReadMutate]);

  const handleRetryMessage = useCallback(
    (failed: Message) => {
      if (failed.clientId == null) return;
      sendMutate({
        chatId,
        content: failed.content ?? undefined,
        clientId: failed.clientId,
      });
    },
    [chatId, sendMutate],
  );

  const handleEditMessage = useCallback((message: Message) => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-composer-textarea]',
    );
    textarea?.focus({ preventScroll: true });
    setEditingMessage(message);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const handleRequestDeleteMessage = useCallback(
    (message: Message) => {
      setPendingDelete(message);
    },
    [setPendingDelete],
  );

  const handleConfirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    deleteMutate(
      { messageId: pendingDelete.id, chatId },
      {
        onError: (error) => {
          setActionError(getErrorMessage(error));
        },
      },
    );

    setEditingMessage((current) =>
      current !== null && current.id === pendingDelete.id ? null : current,
    );
    setPendingDelete(null);
  }, [
    pendingDelete,
    deleteMutate,
    chatId,
    setEditingMessage,
    setPendingDelete,
    setActionError,
  ]);

  const handleRequestChatDelete = useCallback(() => {
    setDeleteChatError(null);
    setIsDeleteChatOpen(true);
  }, []);

  const handleCancelChatDelete = useCallback(() => {
    setIsDeleteChatOpen(false);
    setDeleteChatError(null);
  }, []);

  const deleteChatMutate = deleteChatMutation.mutate;
  const handleConfirmChatDelete = useCallback(
    (scope: DeleteChatScope) => {
      if (!user) return;
      setDeleteChatError(null);
      deleteChatMutate(
        { chatId, scope, currentUserId: user.id },
        {
          onSuccess: () => {
            setIsDeleteChatOpen(false);
          },
          onError: (error) => {
            setDeleteChatError(getErrorMessage(error));
          },
        },
      );
    },
    [user, deleteChatMutate, chatId],
  );

  useEffect(() => {
    if (chatsQuery.isPending) return;
    if (chat !== null) return;
    navigate('/chats', { replace: true });
  }, [chat, chatsQuery.isPending, navigate]);

  if (!user || !chat) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        {chatsQuery.isPending ? t('common.loading') : t('chat.notFound')}
      </div>
    );
  }

  const display = displayChat(chat, user.id);

  const activityNameByUserId = new Map(
    chat.members.map((m) => [
      m.user.id,
      m.user.nickname.length > 0 ? m.user.nickname : m.user.username,
    ]),
  );
  const activityLabel = formatActivity(
    activityRecords,
    display.isGroup,
    activityNameByUserId,
    t,
  );

  const useIosShell = IS_IOS && !isLg;
  const HeaderComponent = useIosShell
    ? ConversationHeaderContent
    : ConversationHeader;

  const headerNode = (
    <HeaderComponent
      name={display.name}
      avatarUrl={display.avatarUrl}
      isGroup={display.isGroup}
      isOnline={display.isOnline}
      lastSeenAt={display.lastSeenAt}
      activityLabel={activityLabel}
      onTitleClick={openInfoPane}
      actions={
        <ChatHeaderActionsMenu
          chat={chat}
          currentUserId={user.id}
          onRequestDelete={handleRequestChatDelete}
        />
      }
    />
  );

  const listNode = messagesQuery.isPending ? (
    <MessagesListSkeleton />
  ) : messagesQuery.isError ? (
    <LoadErrorState
      title={t('chat.loadError')}
      description={getErrorMessage(messagesQuery.error)}
      onRetry={() => {
        void messagesQuery.refetch();
      }}
    />
  ) : (
    <MessagesList
      chat={chat}
      messages={messages}
      currentUserId={user.id}
      editingMessageId={editingMessage?.id ?? null}
      hasNextPage={messagesQuery.hasNextPage}
      isFetchingNextPage={messagesQuery.isFetchingNextPage}
      onLoadOlder={() => {
        void messagesQuery.fetchNextPage();
      }}
      onRetryMessage={handleRetryMessage}
      onEditMessage={handleEditMessage}
      onRequestDeleteMessage={handleRequestDeleteMessage}
    />
  );

  const composerNode = (
    <Composer
      target={{ kind: 'chat', chatId }}
      currentUser={user}
      editingMessage={editingMessage}
      onCancelEdit={handleCancelEdit}
      attachments={attachments}
      onMutationError={setActionError}
      suppressViewportBlur={useIosShell}
    />
  );

  const overlaysNode = (
    <>
      {/* Transient banner for failed edit / delete attempts —
            backend 403 messages ("Edit window has expired", etc.)
            surface here instead of being swallowed. */}
      {actionError !== null && (
        <div className="bg-destructive/10 text-destructive border-destructive/30 pointer-events-none absolute top-20 left-1/2 z-30 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm shadow-md">
          {actionError}
        </div>
      )}

      {/* Drop overlay covers the whole conversation pane while a file
          drag is in progress. `pointer-events-none` lets the drag
          events bubble up to the wrapper. */}
      {isDragActive && editingMessage === null && (
        <div className="bg-primary/10 border-primary pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed">
          <div className="bg-card border-border rounded-2xl border px-6 py-4 text-center shadow-lg">
            <p className="text-foreground text-base font-semibold">
              {t('chat.composer.dropTitle')}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('chat.composer.dropSubtitle', {
                max: MAX_FILES_PER_MESSAGE,
                sizeMb: Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)),
              })}
            </p>
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t('chat.deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('chat.deleteConfirm.description')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('chat.deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteChatConfirmDialog
        pending={isDeleteChatOpen ? { chat } : null}
        currentUserId={user.id}
        isPending={deleteChatMutation.isPending}
        errorMessage={deleteChatError}
        onCancel={handleCancelChatDelete}
        onConfirm={handleConfirmChatDelete}
      />
    </>
  );

  if (useIosShell) {
    return (
      <IosConversationShell
        onPointerDown={handlePagePointerDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        keyboardViewportEnabled={!isInfoPaneOpen}
        header={headerNode}
        list={listNode}
        composer={composerNode}
        overlays={overlaysNode}
      />
    );
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onPointerDown={handlePagePointerDown}
      onPointerUp={handlePagePointerUp}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {headerNode}
      {listNode}
      {composerNode}
      {overlaysNode}
    </div>
  );
}
