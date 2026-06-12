import type { SwPushEnabledMessage } from './sw-push-enabled-message.interface';
import type { SwTokenMessage } from './sw-token-message.interface';

export type SwInboundMessage = SwTokenMessage | SwPushEnabledMessage;
