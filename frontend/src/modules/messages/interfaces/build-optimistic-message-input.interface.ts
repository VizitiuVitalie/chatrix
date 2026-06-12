import type { User } from '@/modules/auth/interfaces/user.interface';
import type { FileResource } from '@/modules/files/interfaces/file.interface';

export interface BuildOptimisticMessageInput {
  chatId: number;
  content: string | null;
  sender: User;
  clientId: string;
  tempId: number;
  files?: FileResource[];
}
