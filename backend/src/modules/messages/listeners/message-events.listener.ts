import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  ClientEvent,
  type MessageCreatedPayload,
  type MessageDeletedPayload,
  type MessageEditedPayload,
} from '../../../events/client-events';
import {
  DomainEvent,
  type MessageCreatedEvent,
  type MessageDeletedEvent,
  type MessageEditedEvent,
} from '../../../events/domain-events';
import { WsEmitter } from '../../../sockets/services/ws-emitter.service';

@Injectable()
export class MessageEventsListener {
  constructor(
    private readonly wsEmitter: WsEmitter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessageEventsListener.name);
  }

  @OnEvent(DomainEvent.MESSAGE_CREATED)
  public handleMessageCreated(event: MessageCreatedEvent): void {
    this.logger.debug(
      'handleMessageCreated',
      { chatId: event.chatId, messageId: event.message.id },
      `Broadcasting ${ClientEvent.MESSAGE_CREATED}`,
    );

    this.wsEmitter.toChatRoom(
      event.chatId,
      ClientEvent.MESSAGE_CREATED,
      event.message satisfies MessageCreatedPayload,
    );
  }

  @OnEvent(DomainEvent.MESSAGE_EDITED)
  public handleMessageEdited(event: MessageEditedEvent): void {
    this.logger.debug(
      'handleMessageEdited',
      { chatId: event.chatId, messageId: event.message.id },
      `Broadcasting ${ClientEvent.MESSAGE_EDITED}`,
    );

    this.wsEmitter.toChatRoom(
      event.chatId,
      ClientEvent.MESSAGE_EDITED,
      event.message satisfies MessageEditedPayload,
    );
  }

  @OnEvent(DomainEvent.MESSAGE_DELETED)
  public handleMessageDeleted(event: MessageDeletedEvent): void {
    this.logger.debug(
      'handleMessageDeleted',
      { chatId: event.chatId, messageId: event.messageId },
      `Broadcasting ${ClientEvent.MESSAGE_DELETED}`,
    );

    this.wsEmitter.toChatRoom(event.chatId, ClientEvent.MESSAGE_DELETED, {
      chatId: event.chatId,
      messageId: event.messageId,
      newLastMessage: event.newLastMessage,
    } satisfies MessageDeletedPayload);
  }
}
