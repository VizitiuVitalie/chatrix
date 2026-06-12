import type { PendingFile } from './pending-file.interface';
import type { AttachmentError } from './attachment-error.interface';

export interface AttachmentUploadsApi {
  pendingFiles: PendingFile[];

  addFiles: (files: readonly File[]) => void;

  removeFile: (clientId: string) => void;

  retryFile: (clientId: string) => void;

  clearAll: () => void;

  isAnyUploading: boolean;

  hasFailed: boolean;

  recentError: AttachmentError | null;

  clearRecentError: () => void;
}
