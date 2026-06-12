import type { Message } from './message.interface';
import type { MessageTickVariant } from './message-tick-variant.type';

export interface MessageContextMenuProps {
  message: Message;
  isOwn: boolean;
  showSenderLabel: boolean;
  isFirstInRun: boolean;
  canEdit: boolean;
  canDelete: boolean;
  tickVariant: MessageTickVariant | null;
  onRetryMessage: (failed: Message) => void;
  onEdit: (message: Message) => void;
  onRequestDelete: (message: Message) => void;
}
