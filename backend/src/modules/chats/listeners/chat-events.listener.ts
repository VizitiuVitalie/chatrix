import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  ClientEvent,
  type ChatCreatedPayload,
  type ChatDeletedPayload,
  type ChatUpdatedPayload,
} from '../../../events/client-events';
import {
  DomainEvent,
  type ChatCreatedEvent,
  type ChatDeletedEvent,
  type ChatUpdatedEvent,
} from '../../../events/domain-events';
import { WsEmitter } from '../../../sockets/services/ws-emitter.service';

@Injectable()
export class ChatEventsListener {
  constructor(
    private readonly wsEmitter: WsEmitter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatEventsListener.name);
  }

  @OnEvent(DomainEvent.CHAT_CREATED)
  public handleChatCreated(event: ChatCreatedEvent): void {
    const recipientUserIds = event.chat.members.map((m) => m.userId);
    this.logger.debug(
      'handleChatCreated',
      { chatId: event.chat.id, recipientCount: recipientUserIds.length },
      `Broadcasting ${ClientEvent.CHAT_CREATED}`,
    );
    for (const userId of recipientUserIds) {
      this.wsEmitter.joinUserToChatRoom(userId, event.chat.id);
      this.wsEmitter.toUser(
        userId,
        ClientEvent.CHAT_CREATED,
        event.chat satisfies ChatCreatedPayload,
      );
    }
  }

  @OnEvent(DomainEvent.CHAT_UPDATED)
  public handleChatUpdated(event: ChatUpdatedEvent): void {
    this.logger.debug(
      'handleChatUpdated',
      { chatId: event.chat.id },
      `Broadcasting ${ClientEvent.CHAT_UPDATED}`,
    );
    this.wsEmitter.toChatRoom(
      event.chat.id,
      ClientEvent.CHAT_UPDATED,
      event.chat satisfies ChatUpdatedPayload,
    );
  }

  @OnEvent(DomainEvent.CHAT_DELETED)
  public handleChatDeleted(event: ChatDeletedEvent): void {
    this.logger.debug(
      'handleChatDeleted',
      { chatId: event.chatId },
      `Broadcasting ${ClientEvent.CHAT_DELETED}`,
    );
    this.wsEmitter.toChatRoom(event.chatId, ClientEvent.CHAT_DELETED, {
      chatId: event.chatId,
    } satisfies ChatDeletedPayload);
  }
}
