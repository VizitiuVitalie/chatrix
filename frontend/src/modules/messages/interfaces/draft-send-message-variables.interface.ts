import type { FileResource } from '@/modules/files/interfaces/file.interface';

export interface DraftSendMessageVariables {
  peerUserId: number;
  content?: string;
  fileIds?: number[];
  files?: FileResource[];
  clientId: string;
}
