import { File as FileIcon, RotateCw, X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { PendingFileChipProps } from '../interfaces/pending-file-chip-props.interface';

export function PendingFileChip({
  pending,
  onRemove,
  onRetry,
}: PendingFileChipProps): ReactElement {
  const { t } = useTranslation();
  const isUploading = pending.status === 'uploading';
  const isFailed = pending.status === 'failed';
  const percent = Math.round(pending.progress * 100);

  return (
    <div
      className={`bg-card group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
        isFailed ? 'border-destructive/50' : 'border-border'
      }`}
      title={pending.file.name}
    >
      {pending.objectUrl !== null ? (
        <img
          src={pending.objectUrl}
          alt={pending.file.name}
          className={`h-full w-full object-cover ${
            isUploading ? 'opacity-70' : ''
          }`}
        />
      ) : (
        <FileIcon
          className={`text-muted-foreground h-6 w-6 ${
            isUploading ? 'opacity-70' : ''
          }`}
        />
      )}

      {isUploading && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
          {percent}%
        </div>
      )}

      {isFailed && (
        <button
          type="button"
          onClick={() => {
            onRetry(pending.clientId);
          }}
          data-keyboard-dismiss-control
          aria-label={t('chat.composer.attachments.retry')}
          title={t('chat.composer.attachments.uploadFailed')}
          className="bg-destructive/10 text-destructive absolute inset-0 flex items-center justify-center"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          onRemove(pending.clientId);
        }}
        data-keyboard-dismiss-control
        aria-label={t('chat.composer.attachments.remove')}
        className="bg-foreground/80 hover:bg-foreground absolute top-0.5 right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--color-background)]"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
