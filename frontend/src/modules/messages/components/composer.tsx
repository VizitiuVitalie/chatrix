import EmojiPicker, {
  Theme as EmojiPickerTheme,
  type EmojiClickData,
} from 'emoji-picker-react';
import { Paperclip, Pencil, Send, Smile, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { IS_IOS } from '@/modules/chats/constants/chats.constants';
import { PendingFileChip } from '@/modules/files/components/pending-file-chip';
import { ALLOWED_MIME_ACCEPT_ATTR } from '@/modules/files/constants/files.constants';
import { useChatActivityEmitter } from '@/modules/realtime/hooks/use-chat-activity-emitter';
import { useTheme } from '@/modules/users/hooks/use-theme';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { useIsLg } from '@/shared/hooks/use-is-lg';
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover';

import {
  COMPOSER_MAX_HEIGHT_PX,
  EMOJI_PICKER_DESKTOP_HEIGHT_PX,
  EMOJI_PICKER_DESKTOP_SIDE_OFFSET_PX,
  EMOJI_PICKER_DESKTOP_WIDTH_PX,
  EMOJI_PICKER_HOVER_CLOSE_DELAY_MS,
  EMOJI_PICKER_HOVER_OPEN_DELAY_MS,
  EMOJI_PICKER_HOVER_SUPPRESS_AFTER_CLOSE_MS,
  MAX_MESSAGE_LENGTH,
  MOBILE_KEYBOARD_CLOSED_EPSILON_PX,
  MOBILE_KEYBOARD_DISMISS_GROW_PX,
  MOBILE_KEYBOARD_DISMISS_RECHECK_MS,
} from '../constants/messages.constants';
import { useDraftSendMessageMutation } from '../hooks/use-draft-send-message-mutation';
import { useEditMessageMutation } from '../hooks/use-edit-message-mutation';
import { useSendMessageMutation } from '../hooks/use-send-message-mutation';
import type { ComposerProps } from '../interfaces/composer-props.interface';

export function Composer({
  target,
  currentUser,
  editingMessage,
  onCancelEdit,
  attachments,
  onMutationError,
  suppressViewportBlur = false,
}: ComposerProps): ReactElement {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState<string>('');
  const [emojiOpen, setEmojiOpen] = useState<boolean>(false);
  const [iosAttachmentSheetOpen, setIosAttachmentSheetOpen] =
    useState<boolean>(false);
  const isLg = useIsLg();
  const isIosMobile = IS_IOS && !isLg;
  const fileInputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const iosAttachmentSheetOpenRef = useRef<boolean>(false);
  const iosFilePickerSessionRef = useRef<number>(0);
  const iosClosedFilePickerSessionRef = useRef<number>(0);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const resetFileInputElement = useCallback(
    (input: HTMLInputElement): void => {
      input.value = '';
      input.blur();
      if (isIosMobile) {
        setFileInputKey((key) => key + 1);
      }
    },
    [isIosMobile],
  );
  const smileButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const hoverSuppressedRef = useRef<boolean>(false);
  const suppressTimeoutRef = useRef<number | null>(null);
  const sendMutation = useSendMessageMutation(currentUser);
  const draftMutation = useDraftSendMessageMutation();
  const editMutation = useEditMessageMutation();
  const isEditing = editingMessage !== null;
  const activityChatId =
    target.kind === 'chat' && !isEditing ? target.chatId : null;
  const activity = useChatActivityEmitter(activityChatId);
  const { notifyTyping, stopTyping, setUploading } = activity;
  const recentAttachmentError = attachments.recentError;
  const clearRecentAttachmentError = attachments.clearRecentError;

  useEffect(() => {
    setUploading(attachments.isAnyUploading);
  }, [attachments.isAnyUploading, setUploading]);

  useEffect(() => {
    iosAttachmentSheetOpenRef.current = iosAttachmentSheetOpen;
  }, [iosAttachmentSheetOpen]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingMessage !== null) {
      const content = editingMessage.content ?? '';
      setValue(content);
      setEmojiOpen(false);
      iosAttachmentSheetOpenRef.current = false;
      setIosAttachmentSheetOpen(false);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus({ preventScroll: true });
          const len = ta.value.length;
          ta.setSelectionRange(len, len);
        }
      });
    } else {
      setValue('');
      setEmojiOpen(false);
      iosAttachmentSheetOpenRef.current = false;
      setIosAttachmentSheetOpen(false);
    }
  }, [editingMessage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return (): void => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (suppressTimeoutRef.current !== null) {
        window.clearTimeout(suppressTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recentAttachmentError === null) return;
    if (recentAttachmentError.key === 'chat.composer.attachments.offline') {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      clearRecentAttachmentError();
    }, 4000);
    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [recentAttachmentError, clearRecentAttachmentError]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta === null) return;
    ta.style.height = 'auto';
    const natural = ta.scrollHeight;
    const clamped = Math.min(natural, COMPOSER_MAX_HEIGHT_PX);
    ta.style.height = `${clamped}px`;
    ta.style.overflowY = natural > COMPOSER_MAX_HEIGHT_PX ? 'auto' : 'hidden';
  }, [value]);

  const targetKey =
    target.kind === 'chat'
      ? `chat:${target.chatId}`
      : `draft:${target.peerUserId}`;
  useEffect(() => {
    if (!isLg) return;
    const id = requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
    return (): void => {
      cancelAnimationFrame(id);
    };
  }, [targetKey, isLg]);

  useEffect(() => {
    const input = fileInputRef.current;
    if (input === null) return undefined;
    const fileInput = input;
    function handleCancel(): void {
      const sessionId = iosFilePickerSessionRef.current;
      const closedSessionId = iosClosedFilePickerSessionRef.current;
      const shouldReopenIosSheet = sessionId > 0 && closedSessionId < sessionId;
      if (isLg) {
        textareaRef.current?.focus({ preventScroll: true });
        return;
      }
      if (isIosMobile) {
        if (!shouldReopenIosSheet) {
          return;
        }
        iosAttachmentSheetOpenRef.current = true;
        setIosAttachmentSheetOpen(true);
        return;
      }
      resetFileInputElement(fileInput);
    }
    input.addEventListener('cancel', handleCancel);
    return (): void => {
      input.removeEventListener('cancel', handleCancel);
    };
  }, [fileInputKey, isIosMobile, isLg, resetFileInputElement]);

  useEffect(() => {
    if (isLg) return undefined;
    if (suppressViewportBlur) return undefined;
    if (typeof window === 'undefined') return undefined;
    const vv = window.visualViewport;
    if (vv === null) return undefined;
    let previousHeight = vv.height;
    let maxViewportHeight = Math.max(vv.height, window.innerHeight);
    let recheckTimeoutId: number | null = null;
    function handleViewportResize(): void {
      if (vv === null) return;
      const next = vv.height;
      maxViewportHeight = Math.max(maxViewportHeight, next, window.innerHeight);
      const grewBack = next > previousHeight + MOBILE_KEYBOARD_DISMISS_GROW_PX;
      previousHeight = next;
      if (!grewBack) return;
      if (recheckTimeoutId !== null) {
        window.clearTimeout(recheckTimeoutId);
      }
      recheckTimeoutId = window.setTimeout(() => {
        recheckTimeoutId = null;
        if (document.activeElement !== textareaRef.current) return;
        const keyboardClosed =
          maxViewportHeight - vv.height <= MOBILE_KEYBOARD_CLOSED_EPSILON_PX;
        if (!keyboardClosed) return;
        textareaRef.current?.blur();
      }, MOBILE_KEYBOARD_DISMISS_RECHECK_MS);
    }
    vv.addEventListener('resize', handleViewportResize);
    return (): void => {
      vv.removeEventListener('resize', handleViewportResize);
      if (recheckTimeoutId !== null) {
        window.clearTimeout(recheckTimeoutId);
      }
    };
  }, [isLg, suppressViewportBlur]);

  const trimmed = value.trim();
  const uploadedFiles = attachments.pendingFiles.filter(
    (p) => p.status === 'uploaded',
  );
  const hasUploadedFiles = uploadedFiles.length > 0;

  const canSubmit = isEditing
    ? trimmed.length > 0 &&
      value.length <= MAX_MESSAGE_LENGTH &&
      trimmed !== editingMessage.content
    : (trimmed.length > 0 || hasUploadedFiles) &&
      value.length <= MAX_MESSAGE_LENGTH &&
      !attachments.isAnyUploading &&
      !attachments.hasFailed;
  function submit(): void {
    if (!canSubmit) return;

    if (isEditing) {
      if (target.kind !== 'chat') return;
      editMutation.mutate(
        {
          messageId: editingMessage.id,
          chatId: target.chatId,
          content: trimmed,
        },
        {
          onError: (error) => {
            onMutationError(getErrorMessage(error));
          },
        },
      );
      onCancelEdit();
      return;
    }

    const fileIds = uploadedFiles
      .map((p) => p.fileId)
      .filter((id): id is number => id !== null);
    const fileResources = uploadedFiles
      .map((p) => p.resource)
      .filter((r): r is NonNullable<typeof r> => r !== null);
    const contentForSend = trimmed.length > 0 ? trimmed : undefined;
    const fileIdsForSend = fileIds.length > 0 ? fileIds : undefined;
    const filesForSend = fileResources.length > 0 ? fileResources : undefined;
    const clientId = crypto.randomUUID();

    if (target.kind === 'draft') {
      draftMutation.mutate(
        {
          peerUserId: target.peerUserId,
          content: contentForSend,
          fileIds: fileIdsForSend,
          files: filesForSend,
          clientId,
        },
        {
          onError: (error) => {
            onMutationError(getErrorMessage(error));
          },
        },
      );
    } else {
      sendMutation.mutate(
        {
          chatId: target.chatId,
          content: contentForSend,
          clientId,
          fileIds: fileIdsForSend,
          files: filesForSend,
        },
        {
          onError: (error) => {
            onMutationError(getErrorMessage(error));
          },
        },
      );
    }
    setValue('');
    stopTyping();
    attachments.clearAll();
    setEmojiOpen(false);
    iosAttachmentSheetOpenRef.current = false;
    setIosAttachmentSheetOpen(false);
    const sentAttachment =
      fileIdsForSend !== undefined || filesForSend !== undefined;
    if (IS_IOS && !isLg && sentAttachment) {
      textareaRef.current?.blur();
    } else {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Escape' && isEditing) {
      event.preventDefault();
      event.stopPropagation();
      onCancelEdit();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;
    if (!files || files.length === 0) {
      resetFileInputElement(event.target);
      return;
    }
    attachments.addFiles(Array.from(files));
    if (isIosMobile) {
      iosClosedFilePickerSessionRef.current = Math.max(
        iosClosedFilePickerSessionRef.current,
        iosFilePickerSessionRef.current,
      );
      iosAttachmentSheetOpenRef.current = false;
      setIosAttachmentSheetOpen(false);
    }
    resetFileInputElement(event.target);
    if (!isLg) return;
    textareaRef.current?.focus({ preventScroll: true });
  }

  function handlePaperclipClick(): void {
    if (isIosMobile) return;
    fileInputRef.current?.click();
  }

  function handleIosPaperclipClick(): void {
    if (isEditing) {
      return;
    }

    iosAttachmentSheetOpenRef.current = true;
    setIosAttachmentSheetOpen(true);
    textareaRef.current?.blur();
  }

  function handleIosAttachmentSheetChoose(): void {
    iosFilePickerSessionRef.current = iosFilePickerSessionRef.current + 1;
  }

  function closeIosAttachmentSheet(): void {
    iosClosedFilePickerSessionRef.current = Math.max(
      iosClosedFilePickerSessionRef.current,
      iosFilePickerSessionRef.current,
    );
    iosAttachmentSheetOpenRef.current = false;
    setIosAttachmentSheetOpen(false);
  }

  function handlePaperclipPointerDown(
    event: ReactPointerEvent<HTMLElement>,
  ): void {
    event.preventDefault();
  }

  function clearOpenTimeout(): void {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }

  function clearCloseTimeout(): void {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function scheduleEmojiOpen(): void {
    clearCloseTimeout();
    if (hoverSuppressedRef.current) return;
    if (emojiOpen) return;
    if (openTimeoutRef.current !== null) return;
    openTimeoutRef.current = window.setTimeout(() => {
      openTimeoutRef.current = null;
      setEmojiOpen(true);
    }, EMOJI_PICKER_HOVER_OPEN_DELAY_MS);
  }

  function scheduleEmojiClose(): void {
    clearOpenTimeout();
    if (!emojiOpen) return;
    if (closeTimeoutRef.current !== null) return;
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setEmojiOpen(false);
    }, EMOJI_PICKER_HOVER_CLOSE_DELAY_MS);
  }

  function handleOpenChange(open: boolean): void {
    setEmojiOpen(open);
    if (!open) {
      hoverSuppressedRef.current = true;
      if (suppressTimeoutRef.current !== null) {
        window.clearTimeout(suppressTimeoutRef.current);
      }
      suppressTimeoutRef.current = window.setTimeout(() => {
        hoverSuppressedRef.current = false;
        suppressTimeoutRef.current = null;
      }, EMOJI_PICKER_HOVER_SUPPRESS_AFTER_CLOSE_MS);
    }
  }

  function handleEmojiClick(data: EmojiClickData): void {
    setValue((prev) => {
      if (prev.length + data.emoji.length > MAX_MESSAGE_LENGTH) return prev;
      const ta = textareaRef.current;
      const insertAt =
        pendingCaretRef.current ?? ta?.selectionStart ?? prev.length;
      pendingCaretRef.current = insertAt + data.emoji.length;
      return prev.slice(0, insertAt) + data.emoji + prev.slice(insertAt);
    });
    requestAnimationFrame(() => {
      const taLive = textareaRef.current;
      if (taLive === null) return;
      const newPos = pendingCaretRef.current;
      if (newPos === null) return;
      pendingCaretRef.current = null;
      taLive.focus({ preventScroll: true });
      taLive.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <form
      action="javascript:void(0)"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-border/80 bg-card/85 border-t px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_oklch(0.28_0.04_270/_0.04)] backdrop-blur-xl"
    >
      <input
        key={fileInputKey}
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_ACCEPT_ATTR}
        onChange={handleFileInputChange}
        disabled={isEditing}
        className={isIosMobile ? 'sr-only' : 'hidden'}
      />

      {isIosMobile &&
        iosAttachmentSheetOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end px-2 pb-[max(8px,env(safe-area-inset-bottom))]"
            aria-modal="true"
            role="dialog"
          >
            <button
              type="button"
              aria-label={t('common.cancel')}
              onClick={closeIosAttachmentSheet}
              data-keyboard-dismiss-control
              className="absolute inset-0"
            />
            <div className="relative mx-auto w-full max-w-md">
              <div className="bg-card/95 border-border/70 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl">
                <div className="border-border/70 border-b px-4 py-3 text-center">
                  <p className="text-foreground text-sm font-semibold">
                    {t('chat.composer.attachSheet.title')}
                  </p>
                </div>
                <label
                  htmlFor={fileInputId}
                  onClick={handleIosAttachmentSheetChoose}
                  className="text-foreground hover:bg-secondary/80 flex h-14 w-full cursor-pointer items-center gap-3 px-4 text-sm font-medium active:bg-secondary"
                >
                  <span className="bg-primary/10 text-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  {t('chat.composer.attachSheet.chooseFiles')}
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeIosAttachmentSheet();
                }}
                className="bg-card/95 text-primary mt-2 h-12 w-full rounded-2xl border border-border/70 text-sm font-semibold shadow-xl backdrop-blur-xl active:bg-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {isEditing && (
        <div className="border-primary/30 bg-primary/5 mb-2 flex items-start gap-3 rounded-xl border px-3 py-2">
          <Pencil className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-primary text-xs font-semibold">
              {t('chat.composer.editing')}
            </p>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {editingMessage.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label={t('chat.composer.cancelEdit')}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {attachments.recentError !== null && (
        <div
          className={
            attachments.recentError.key === 'chat.composer.attachments.offline'
              ? 'bg-muted text-muted-foreground border-border mb-2 rounded-xl border px-3 py-1.5 text-xs'
              : 'bg-destructive/10 text-destructive border-destructive/30 mb-2 rounded-xl border px-3 py-1.5 text-xs'
          }
        >
          {t(
            attachments.recentError.key,
            attachments.recentError.params as Record<string, unknown>,
          )}
        </div>
      )}

      {!isEditing && attachments.pendingFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.pendingFiles.map((pending) => (
            <PendingFileChip
              key={pending.clientId}
              pending={pending}
              onRemove={attachments.removeFile}
              onRetry={attachments.retryFile}
            />
          ))}
        </div>
      )}

      <div className="bg-secondary flex items-end gap-2 rounded-2xl px-3 py-2">
        {isIosMobile ? (
          <button
            type="button"
            onClick={handleIosPaperclipClick}
            onPointerDown={handlePaperclipPointerDown}
            disabled={isEditing}
            data-keyboard-dismiss-control
            aria-label={t('chat.composer.attach')}
            title={t('chat.composer.attach')}
            className="text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring/40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePaperclipClick}
            onPointerDown={handlePaperclipPointerDown}
            disabled={isEditing}
            data-keyboard-dismiss-control
            aria-label={t('chat.composer.attach')}
            title={t('chat.composer.attach')}
            className="text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring/40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          data-composer-textarea
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            if (next.length > 0) notifyTyping();
            else stopTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isEditing
              ? t('chat.composer.editPlaceholder')
              : t('chat.composer.placeholder')
          }
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          className="text-foreground placeholder:text-muted-foreground flex-1 resize-none select-text bg-transparent py-2 text-base focus:outline-none"
        />

        {isLg && (
          <Popover open={emojiOpen} onOpenChange={handleOpenChange}>
            <PopoverAnchor asChild>
              <button
                ref={smileButtonRef}
                type="button"
                onMouseEnter={scheduleEmojiOpen}
                onMouseLeave={scheduleEmojiClose}
                aria-label={t('chat.composer.emoji')}
                title={t('chat.composer.emoji')}
                aria-expanded={emojiOpen}
                className="text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring/40 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2"
              >
                <Smile className="h-5 w-5" />
              </button>
            </PopoverAnchor>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={EMOJI_PICKER_DESKTOP_SIDE_OFFSET_PX}
              onMouseEnter={clearCloseTimeout}
              onMouseLeave={scheduleEmojiClose}
              onMouseDown={(event) => {
                const target = event.target as HTMLElement;
                if (
                  target.tagName === 'INPUT' ||
                  target.tagName === 'TEXTAREA'
                ) {
                  return;
                }
                event.preventDefault();
              }}
              onPointerDownOutside={(event) => {
                const target = event.target as Node | null;
                if (
                  target !== null &&
                  smileButtonRef.current?.contains(target)
                ) {
                  event.preventDefault();
                }
              }}
              onFocusOutside={(event) => {
                event.preventDefault();
              }}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
              }}
              className="w-auto border-none bg-transparent p-0 shadow-none ring-0"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={
                  resolvedTheme === 'dark'
                    ? EmojiPickerTheme.DARK
                    : EmojiPickerTheme.LIGHT
                }
                width={EMOJI_PICKER_DESKTOP_WIDTH_PX}
                height={EMOJI_PICKER_DESKTOP_HEIGHT_PX}
                lazyLoadEmojis
                autoFocusSearch={false}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </PopoverContent>
          </Popover>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          onPointerDown={(e) => {
            e.preventDefault();
          }}
          aria-label={
            isEditing ? t('chat.composer.save') : t('chat.composer.send')
          }
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/40 relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm outline-none transition-all after:absolute after:-inset-2 after:content-[''] hover:shadow-md focus-visible:ring-2 disabled:opacity-50 disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
