import type { Chat } from './chat.interface';

export interface ChatAvatarHeroEditorProps {
  chat: Chat;
  chatName: string;
  canEdit: boolean;
  onAvatarClick: () => void;
}
