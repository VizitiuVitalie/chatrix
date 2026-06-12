import type { FileResource } from '@/modules/files/interfaces/file.interface';

export interface SendMessageVariables {
  chatId: number;
  content?: string;
  clientId: string;
  fileIds?: number[];
  files?: FileResource[];
}
