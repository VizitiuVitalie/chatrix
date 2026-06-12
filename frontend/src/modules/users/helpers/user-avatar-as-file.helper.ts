import type { User } from '@/modules/auth/interfaces/user.interface';
import type { FileResource } from '@/modules/files/interfaces/file.interface';

import { extensionFromUrl } from './extension-from-url.helper';

export function userAvatarAsFile(user: User): FileResource {
  if (user.avatarUrl === null) {
    throw new Error('userAvatarAsFile called on a user without an avatar');
  }
  const displayName = user.nickname.length > 0 ? user.nickname : user.username;
  const extension = extensionFromUrl(user.avatarUrl);
  return {
    id: -user.id,
    kind: 'user_avatar',
    originalName: `${displayName}-avatar${extension}`,
    mimeType: 'application/octet-stream',
    sizeBytes: 0,
    downloadUrl: user.avatarUrl,
    thumbnailUrl: user.thumbnailUrl,
    width: null,
    height: null,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  };
}
