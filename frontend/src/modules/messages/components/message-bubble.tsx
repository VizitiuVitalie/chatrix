import {
  Check,
  CheckCheck,
  Clock,
  Download,
  File as FileIcon,
  Play,
} from 'lucide-react';
import { memo, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { isVideoMime } from '@/modules/files/constants/files.constants';
import { downloadAuthenticatedFile } from '@/modules/files/helpers/download-authenticated-file.helper';
import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { useAuthenticatedBlobUrl } from '@/modules/files/hooks/use-authenticated-blob-url';
import type { FileResource } from '@/modules/files/interfaces/file.interface';
import { GIB, KIB, MIB } from '@/shared/constants/byte-units.constants';
import { formatMessageTime } from '@/shared/helpers/date.helper';
import { CheckCheckGroupIcon } from '@/shared/ui/check-check-group-icon';

import type { MessageBubbleProps } from '../interfaces/message-bubble-props.interface';

export const MessageBubble = memo(MessageBubbleImpl);

function MessageBubbleImpl({
  message,
  isOwn,
  showSenderLabel,
  isFirstInRun,
  tickVariant,
}: MessageBubbleProps): ReactElement {
  const { t, i18n } = useTranslation();
  const time = formatMessageTime(new Date(message.createdAt), i18n.language);
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';

  const tailCornerClass = isOwn
    ? isFirstInRun
      ? 'rounded-xl rounded-tr-sm'
      : 'rounded-xl'
    : isFirstInRun
      ? 'rounded-xl rounded-tl-sm'
      : 'rounded-xl';

  const bubbleColorClass = isFailed
    ? 'bg-destructive/10 text-foreground ring-1 ring-destructive/40'
    : isOwn
      ? `bg-[var(--color-bubble-out)] text-foreground${
          isPending ? ' opacity-70' : ''
        }`
      : 'bg-[var(--color-bubble-in)] text-foreground';

  const hasImageAttachment = message.files.some((file) =>
    file.mimeType.startsWith('image/'),
  );
  const widthClass = hasImageAttachment
    ? 'w-[min(70%,_300px)]'
    : 'max-w-[min(70%,_520px)]';

  const meta = (
    <span className="text-muted-foreground inline-flex shrink-0 select-none items-center gap-1 text-[11px] leading-none">
      {message.editedAt !== null && (
        <span className="italic">{t('chat.edited')}</span>
      )}
      <span>{time}</span>
      {isOwn &&
        !isPending &&
        !isFailed &&
        tickVariant !== null &&
        (tickVariant === 'two-blue-with-group' ? (
          <CheckCheckGroupIcon className="text-primary h-3.5 w-5" />
        ) : tickVariant === 'two-blue' ? (
          <CheckCheck className="text-primary h-3.5 w-3.5" />
        ) : (
          <Check className="text-muted-foreground h-3.5 w-3.5" />
        ))}
      {isOwn && isPending && (
        <Clock
          className="text-muted-foreground h-3.5 w-3.5"
          aria-label={t('chat.message.sending')}
        />
      )}
    </span>
  );

  return (
    <div
      className={`${widthClass} ${tailCornerClass} ${bubbleColorClass} px-4 py-1.5 text-[15px] shadow-[0_2px_6px_oklch(0.28_0.04_270/_0.10)]`}
    >
      {showSenderLabel && (
        <div className="text-primary mb-0.5 text-xs font-semibold">
          {message.sender.nickname}
        </div>
      )}

      {/* Attachments first, caption below — Telegram-style. The
          rationale: the media is the message; the text annotates.
          Reading order: see the image, then read the caption, then
          glance at the timestamp / ticks. */}
      {message.files.length > 0 && (
        <div className="space-y-2">
          {message.files.map((file) => (
            <MessageAttachment key={file.id} file={file} />
          ))}
        </div>
      )}

      {message.content !== null && message.content.length > 0 ? (
        <div
          className={`flex items-end gap-x-2 ${
            message.files.length > 0 ? 'mt-2' : ''
          }`}
        >
          <div className="min-w-0 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {meta}
        </div>
      ) : message.files.length > 0 ? (
        <div className="mt-1 flex justify-end">{meta}</div>
      ) : (
        <>
          <div className="text-muted-foreground text-sm italic">
            {t('chat.message.attachmentUnavailable')}
          </div>
          <div className="mt-1 flex justify-end">{meta}</div>
        </>
      )}
    </div>
  );
}

function MessageAttachment({ file }: { file: FileResource }): ReactElement {
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = isVideoMime(file.mimeType);
  const isGif = file.mimeType === 'image/gif';
  const previewUrl = isGif ? file.downloadUrl : file.thumbnailUrl;
  const showImagePreview = isImage && previewUrl !== null;
  const previewState = useAuthenticatedBlobUrl(
    showImagePreview ? previewUrl : null,
  );
  const aspectRatio =
    file.width !== null &&
    file.height !== null &&
    file.width > 0 &&
    file.height > 0
      ? file.width / file.height
      : null;
  const { openViewer } = useAttachmentViewer();

  const handleOpenViewer = useCallback((): void => {
    openViewer(file);
  }, [openViewer, file]);

  const handleDownload = useCallback((): void => {
    void downloadAuthenticatedFile(file.downloadUrl, file.originalName);
  }, [file.downloadUrl, file.originalName]);

  if (showImagePreview && previewState.error === null) {
    return (
      <button
        type="button"
        onClick={handleOpenViewer}
        aria-label={file.originalName}
        className="bg-muted block w-full overflow-hidden rounded-xl"
        style={aspectRatio !== null ? { aspectRatio } : undefined}
      >
        {previewState.url !== null ? (
          <img
            src={previewState.url}
            alt={file.originalName}
            className={
              aspectRatio !== null
                ? 'block h-full w-full rounded-xl object-cover'
                : 'block h-auto w-full rounded-xl'
            }
          />
        ) : (
          <div
            className={`w-full animate-pulse ${
              aspectRatio !== null ? 'h-full' : 'aspect-[4/3]'
            }`}
          />
        )}
      </button>
    );
  }

  if (isVideo) {
    return (
      <button
        type="button"
        onClick={handleOpenViewer}
        aria-label={file.originalName}
        className="bg-card border-border hover:bg-secondary flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors"
      >
        <span className="bg-primary/15 text-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate font-medium">
            {file.originalName}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            {formatExtension(file)} · {formatBytes(file.sizeBytes)}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="bg-card border-border hover:bg-secondary flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors"
    >
      <FileIcon className="text-primary h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate font-medium">
          {file.originalName}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {formatExtension(file)} · {formatBytes(file.sizeBytes)}
        </div>
      </div>
      <Download className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  );
}

function formatExtension(file: FileResource): string {
  const dotIndex = file.originalName.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < file.originalName.length - 1) {
    return file.originalName.slice(dotIndex + 1).toUpperCase();
  }
  const subtype = file.mimeType.split('/')[1] ?? file.mimeType;
  return subtype.toUpperCase();
}

function formatBytes(bytes: number): string {
  if (bytes < KIB) return `${bytes} B`;
  if (bytes < MIB) return `${(bytes / KIB).toFixed(1)} KB`;
  if (bytes < GIB) return `${(bytes / MIB).toFixed(1)} MB`;
  return `${(bytes / GIB).toFixed(1)} GB`;
}
