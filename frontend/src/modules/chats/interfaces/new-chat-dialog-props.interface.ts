import type { NewChatMode } from './new-chat-mode.type';

export interface NewChatDialogProps {
  mode: NewChatMode;
  onClose: () => void;
}
