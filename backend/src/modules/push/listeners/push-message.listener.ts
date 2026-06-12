import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  DomainEvent,
  type MessageCreatedEvent,
} from '../../../events/domain-events';
import { PushService } from '../push.service';

@Injectable()
export class PushMessageListener {
  constructor(
    private readonly pushService: PushService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PushMessageListener.name);
  }

  @OnEvent(DomainEvent.MESSAGE_CREATED)
  public async handleMessageCreated(event: MessageCreatedEvent): Promise<void> {
    try {
      await this.pushService.deliverForMessage(event);
    } catch (error) {
      this.logger.error(
        'handleMessageCreated',
        {
          chatId: event.chatId,
          messageId: event.message.id,
          errorMessage: (error as Error).message,
        },
        'Push fan-out failed at the top level',
      );
    }
  }
}
