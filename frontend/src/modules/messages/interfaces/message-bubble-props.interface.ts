import type { Message } from './message.interface';
import type { MessageTickVariant } from './message-tick-variant.type';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderLabel: boolean;
  isFirstInRun: boolean;
  tickVariant: MessageTickVariant | null;
}
