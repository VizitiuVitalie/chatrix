import type { Chat } from '@/modules/chats/interfaces/chat.interface';
import type { FileResource } from '@/modules/files/interfaces/file.interface';

import { CHAT_AVATAR_SYNTHETIC_ID_OFFSET } from '../constants/users.constants';
import { extensionFromUrl } from './extension-from-url.helper';

export function chatAvatarAsFile(chat: Chat, chatName: string): FileResource {
  if (chat.avatarUrl === null) {
    throw new Error('chatAvatarAsFile called on a chat without an avatar');
  }
  const extension = extensionFromUrl(chat.avatarUrl);
  const cleanName = chatName.replace(/[/\\]/g, '_');
  return {
    id: -CHAT_AVATAR_SYNTHETIC_ID_OFFSET - chat.id,
    kind: 'chat_avatar',
    originalName: `${cleanName}-avatar${extension}`,
    mimeType: 'application/octet-stream',
    sizeBytes: 0,
    downloadUrl: chat.avatarUrl,
    thumbnailUrl: chat.thumbnailUrl,
    width: null,
    height: null,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  };
}
