import { Download, Loader2, Trash2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  isImageMime,
  isVideoMime,
} from '@/modules/files/constants/files.constants';
import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { useAuthenticatedBlobUrl } from '@/modules/files/hooks/use-authenticated-blob-url';
import { downloadAuthenticatedFile } from '@/modules/files/helpers/download-authenticated-file.helper';

import { formatBytes } from '../helpers/format-bytes.helper';
import { pickFileIcon } from '../helpers/pick-file-icon.helper';
import type { ProfileFileRowProps } from '../interfaces/profile-file-row-props.interface';

export function ProfileFileRow({
  file,
  isPending,
  onRequestDelete,
}: ProfileFileRowProps): ReactElement {
  const { t } = useTranslation();
  const { openViewer } = useAttachmentViewer();
  const isImage = isImageMime(file.mimeType);
  const isVideo = isVideoMime(file.mimeType);
  const isOpenable = isImage || isVideo;
  const thumbnail = useAuthenticatedBlobUrl(isImage ? file.thumbnailUrl : null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  async function handleDownload(): Promise<void> {
    setIsDownloading(true);
    try {
      await downloadAuthenticatedFile(file.downloadUrl, file.originalName);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      className={`border-border bg-card hover:bg-secondary/40 flex items-center gap-3 rounded-xl border p-3 transition-colors ${isOpenable ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (isOpenable) openViewer(file);
      }}
      onKeyDown={(event) => {
        if (!isOpenable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openViewer(file);
        }
      }}
      role={isOpenable ? 'button' : undefined}
      tabIndex={isOpenable ? 0 : undefined}
    >
      <div className="bg-secondary text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {isImage && thumbnail.url !== null ? (
          <img
            src={thumbnail.url}
            alt={file.originalName}
            className="h-full w-full object-cover"
          />
        ) : isImage && thumbnail.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          pickFileIcon(file.mimeType, 'h-5 w-5')
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">
          {file.originalName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {formatBytes(file.sizeBytes)} · {file.mimeType}
        </p>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleDownload();
        }}
        disabled={isDownloading}
        aria-label={t('profile.files.downloadLabel')}
        className="text-muted-foreground hover:bg-card hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRequestDelete(file);
        }}
        disabled={isPending}
        aria-label={t('profile.files.deleteLabel')}
        className="text-destructive hover:bg-destructive/10 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
