import { ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useIsLg } from '@/shared/hooks/use-is-lg';

import {
  EDIT_SCROLL_SUPPRESS_MS,
  OLDER_MESSAGES_PRELOAD_MARGIN_PX,
  SCROLL_IDLE_HIDE_MS,
  STICK_TO_BOTTOM_TOLERANCE_PX,
} from '../constants/messages.constants';
import { canDeleteMessage } from '../helpers/can-delete-message.helper';
import { canEditMessage } from '../helpers/can-edit-message.helper';
import {
  groupMessagesByDay,
  isSameSenderRun,
} from '../helpers/group-messages-by-day.helper';
import { getMessageTickVariant } from '../helpers/get-message-tick-variant.helper';
import type { MessagesListProps } from '../interfaces/messages-list-props.interface';
import { DateSeparator } from './date-separator';
import { MessageContextMenu } from './message-context-menu';

export function MessagesList({
  chat,
  messages,
  currentUserId,
  editingMessageId,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  onRetryMessage,
  onEditMessage,
  onRequestDeleteMessage,
}: MessagesListProps): ReactElement {
  const { t } = useTranslation();
  const isLg = useIsLg();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const isAtBottomRef = useRef<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const lastSeenMessageIdRef = useRef<number | string | null>(null);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const ignoreScrollIndicatorRef = useRef<boolean>(false);
  const now = useMemo(() => new Date(), []);
  const grouped = useMemo(() => groupMessagesByDay(messages), [messages]);
  const groupedReversed = useMemo(() => [...grouped].reverse(), [grouped]);
  const scrollToBottom = useCallback((): void => {
    const container = containerRef.current;
    if (container === null) return;
    container.scrollTop = 0;
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }, []);

  const editingMessageIdRef = useRef<number | null>(null);
  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
  }, [editingMessageId]);

  const scrollMessageIntoView = useCallback((messageId: number): void => {
    const container = containerRef.current;
    if (container === null) return;
    const row = container.querySelector<HTMLElement>(
      `[data-message-id="${messageId}"]`,
    );
    if (row === null) return;
    const docScrollX = window.scrollX;
    const docScrollY = window.scrollY;
    row.scrollIntoView({ block: 'nearest' });
    if (window.scrollX !== docScrollX || window.scrollY !== docScrollY) {
      window.scrollTo(docScrollX, docScrollY);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const handleScroll = (): void => {
      const distanceFromBottom = Math.abs(container.scrollTop);
      const atBottom = distanceFromBottom <= STICK_TO_BOTTOM_TOLERANCE_PX;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
      if (atBottom) setUnreadCount(0);

      if (ignoreScrollIndicatorRef.current) return;

      setIsScrolling(true);
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
      scrollIdleTimerRef.current = window.setTimeout(() => {
        scrollIdleTimerRef.current = null;
        setIsScrolling(false);
      }, SCROLL_IDLE_HIDE_MS);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, []);

  const lastMessage = messages[messages.length - 1] ?? null;
  const lastMessageKey: number | string | null =
    lastMessage === null ? null : (lastMessage.clientId ?? lastMessage.id);

  useLayoutEffect(() => {
    if (lastMessage === null || lastMessageKey === null) return;
    if (lastSeenMessageIdRef.current === null) {
      lastSeenMessageIdRef.current = lastMessageKey;
      return;
    }
    if (lastSeenMessageIdRef.current === lastMessageKey) return;
    lastSeenMessageIdRef.current = lastMessageKey;

    const isOwnSend = lastMessage.senderId === currentUserId;
    if (isOwnSend || isAtBottomRef.current) {
      scrollToBottom();
    } else {
      setUnreadCount((n) => n + 1);
    }
  }, [lastMessage, lastMessageKey, currentUserId, scrollToBottom]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const container = containerRef.current;
    if (container === null) return undefined;
    const handleViewportResize = (): void => {
      const editingId = editingMessageIdRef.current;
      if (editingId !== null) {
        scrollMessageIntoView(editingId);
        return;
      }
      if (!isAtBottomRef.current) return;
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    };
    vv.addEventListener('resize', handleViewportResize);
    return (): void => {
      vv.removeEventListener('resize', handleViewportResize);
    };
  }, [scrollMessageIntoView]);

  useLayoutEffect(() => {
    if (editingMessageId === null) return;
    scrollMessageIntoView(editingMessageId);
  }, [editingMessageId, scrollMessageIntoView]);

  useLayoutEffect(() => {
    ignoreScrollIndicatorRef.current = true;
    const timer = window.setTimeout(() => {
      ignoreScrollIndicatorRef.current = false;
    }, EDIT_SCROLL_SUPPRESS_MS);
    return (): void => {
      window.clearTimeout(timer);
    };
  }, [editingMessageId]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (sentinel === null) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !isFetchingNextPage
        ) {
          onLoadOlder();
        }
      },
      {
        root: containerRef.current,
        rootMargin: `${OLDER_MESSAGES_PRELOAD_MARGIN_PX}px 0px 0px 0px`,
      },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, onLoadOlder]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        data-ios-scroll-lock-allow
        className="flex flex-1 flex-col-reverse overflow-y-auto overscroll-contain px-4 py-2"
      >
        {groupedReversed.map((group) => (
          <div key={group.dayKey}>
            <DateSeparator day={group.day} now={now} />
            {group.messages.map((message, idx) => {
              const isOwn = message.senderId === currentUserId;
              const previous = group.messages[idx - 1] ?? null;
              const isFirstInRun =
                previous === null || !isSameSenderRun(previous, message);
              const showSenderLabel =
                chat.type === 'group' && !isOwn && isFirstInRun;

              const canEdit = canEditMessage(message, currentUserId);
              const canDelete = canDeleteMessage(message, chat, currentUserId);

              const tickVariant = isOwn
                ? getMessageTickVariant(message, chat, currentUserId)
                : null;

              const bubbleKey = message.clientId ?? message.id;
              return (
                <MessageContextMenu
                  key={bubbleKey}
                  message={message}
                  isOwn={isOwn}
                  showSenderLabel={showSenderLabel}
                  isFirstInRun={isFirstInRun}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  tickVariant={tickVariant}
                  onRetryMessage={onRetryMessage}
                  onEdit={onEditMessage}
                  onRequestDelete={onRequestDeleteMessage}
                />
              );
            })}
          </div>
        ))}
        {/* Sentinel at the DOM end = the visual top; intersecting it
            (pre-loaded via rootMargin) pulls the next older page. */}
        {hasNextPage && <div ref={topSentinelRef} />}
      </div>

      {!isAtBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label={t('chat.jumpToBottom')}
          className={`bg-card text-foreground border-border hover:bg-secondary absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition duration-200 hover:scale-105 ${
            isLg || isScrolling || unreadCount > 0
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronDown className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
