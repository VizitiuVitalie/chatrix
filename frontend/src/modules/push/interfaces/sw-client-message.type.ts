import type { NavigateToChatMessage } from './navigate-to-chat-message.interface';
import type { PushResubscribeMessage } from './push-resubscribe-message.interface';

export type SwClientMessage = NavigateToChatMessage | PushResubscribeMessage;
