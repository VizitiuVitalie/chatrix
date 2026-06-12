import type { PendingFile } from './pending-file.interface';

export interface PendingFileChipProps {
  pending: PendingFile;
  onRemove: (clientId: string) => void;
  onRetry: (clientId: string) => void;
}
