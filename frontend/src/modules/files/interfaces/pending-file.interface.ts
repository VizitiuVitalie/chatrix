import type { FileResource } from './file.interface';

export interface PendingFile {
  clientId: string;
  file: File;
  status: 'uploading' | 'uploaded' | 'failed';
  progress: number;
  fileId: number | null;
  resource: FileResource | null;
  objectUrl: string | null;
  errorMessage: string | null;
}
