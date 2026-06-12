import type { User } from '@/modules/auth/interfaces/user.interface';

import type { FileResource } from '@/modules/files/interfaces/file.interface';

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string | null;
  editedAt: string | null;
  sender: User;
  files: FileResource[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  clientId?: string | null;
  status?: 'pending' | 'failed';
}
