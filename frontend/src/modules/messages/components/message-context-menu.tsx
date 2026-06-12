import { Copy, Download, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { memo, useCallback, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadAuthenticatedFile } from '@/modules/files/helpers/download-authenticated-file.helper';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

import { CONTEXT_MENU_FILENAME_MAX_LENGTH } from '../constants/messages.constants';
import type { MessageContextMenuProps } from '../interfaces/message-context-menu-props.interface';
import { MessageBubble } from './message-bubble';

function truncateFilename(name: string): string {
  if (name.length <= CONTEXT_MENU_FILENAME_MAX_LENGTH) return name;
  return `${name.slice(0, CONTEXT_MENU_FILENAME_MAX_LENGTH)}…`;
}

export const MessageContextMenu = memo(MessageContextMenuImpl);

function MessageContextMenuImpl({
  message,
  isOwn,
  showSenderLabel,
  isFirstInRun,
  canEdit,
  canDelete,
  tickVariant,
  onRetryMessage,
  onEdit,
  onRequestDelete,
}: MessageContextMenuProps): ReactElement {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const hasContent = message.content !== null && message.content.length > 0;
  const files = message.files;
  const hasFiles = files.length > 0;
  const hasAnyMenuItem = hasContent || hasFiles || canEdit || canDelete;

  const handleRetry = useCallback((): void => {
    onRetryMessage(message);
  }, [onRetryMessage, message]);

  async function handleCopy(): Promise<void> {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(message.content as string);
    } catch {}
  }

  function handleDownloadAll(): void {
    for (const file of files) {
      void downloadAuthenticatedFile(file.downloadUrl, file.originalName);
    }
  }

  const showRetryAction = message.status === 'failed' && isOwn;
  const rowBaseClass = `mb-1 flex w-full scroll-mb-2 items-center gap-2 lg:mx-auto lg:max-w-[860px] ${
    isOwn ? 'justify-end' : 'justify-start'
  } rounded-2xl px-1 transition-colors`;
  const rowHighlightClass = isOpen ? 'bg-foreground/5' : '';
  const rowClass = `${rowBaseClass} ${rowHighlightClass}`;

  const retryButton = showRetryAction ? (
    <button
      type="button"
      onClick={handleRetry}
      aria-label={t('chat.message.retry')}
      title={t('chat.message.failed')}
      className="text-destructive border-destructive/40 bg-card hover:bg-destructive/10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors"
    >
      <RotateCw className="h-3.5 w-3.5" />
    </button>
  ) : null;

  const bubble = (
    <MessageBubble
      message={message}
      isOwn={isOwn}
      showSenderLabel={showSenderLabel}
      isFirstInRun={isFirstInRun}
      tickVariant={tickVariant}
    />
  );

  if (!hasAnyMenuItem) {
    return (
      <div className={rowBaseClass} data-message-id={message.id}>
        {retryButton}
        {bubble}
      </div>
    );
  }

  return (
    <ContextMenu modal={false} onOpenChange={setIsOpen}>
      <ContextMenuTrigger asChild>
        <div className={rowClass} data-message-id={message.id}>
          {retryButton}
          {bubble}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        {hasContent && (
          <ContextMenuItem
            onSelect={() => {
              void handleCopy();
            }}
          >
            <Copy />
            {t('chat.actions.copy')}
          </ContextMenuItem>
        )}
        {hasFiles && (
          <>
            {hasContent && <ContextMenuSeparator />}
            {files.length > 1 && (
              <ContextMenuItem onSelect={handleDownloadAll}>
                <Download />
                {t('chat.actions.downloadAll', { count: files.length })}
              </ContextMenuItem>
            )}
            {files.map((file) => (
              <ContextMenuItem
                key={file.id}
                title={file.originalName}
                onSelect={() => {
                  void downloadAuthenticatedFile(
                    file.downloadUrl,
                    file.originalName,
                  );
                }}
              >
                <Download />
                <span className="min-w-0 flex-1 truncate">
                  {truncateFilename(file.originalName)}
                </span>
              </ContextMenuItem>
            ))}
          </>
        )}
        {canEdit && (
          <>
            {(hasContent || hasFiles) && <ContextMenuSeparator />}
            <ContextMenuItem
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onSelect={() => {
                onEdit(message);
              }}
            >
              <Pencil />
              {t('chat.actions.edit')}
            </ContextMenuItem>
          </>
        )}
        {canDelete && (
          <>
            {(hasContent || hasFiles || canEdit) && <ContextMenuSeparator />}
            <ContextMenuItem
              variant="destructive"
              onSelect={() => {
                onRequestDelete(message);
              }}
            >
              <Trash2 />
              {t('chat.actions.delete')}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
