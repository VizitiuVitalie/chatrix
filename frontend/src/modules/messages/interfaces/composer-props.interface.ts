import type { User } from '@/modules/auth/interfaces/user.interface';
import type { AttachmentUploadsApi } from '@/modules/files/hooks/use-attachment-uploads';

import type { ComposerTarget } from './composer-target.type';
import type { Message } from './message.interface';

export interface ComposerProps {
  target: ComposerTarget;
  currentUser: User;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  attachments: AttachmentUploadsApi;
  onMutationError: (message: string | null) => void;
  suppressViewportBlur?: boolean;
}
