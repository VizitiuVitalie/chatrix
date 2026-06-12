import type { User } from '@/modules/auth/interfaces/user.interface';

import type { ProfileAvatarEditorTarget } from './profile-avatar-editor-target.type';

export interface ProfileAvatarEditorProps {
  user: User;
  pendingTarget: ProfileAvatarEditorTarget;
  onPendingChange: (next: ProfileAvatarEditorTarget) => void;
  isSaving: boolean;
}
