import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  ClientEvent,
  type ChatMemberAddedPayload,
  type ChatMemberReadPayload,
  type ChatMemberRemovedPayload,
  type ChatMemberRoleChangedPayload,
} from '../../../events/client-events';
import {
  DomainEvent,
  type ChatMemberAddedEvent,
  type ChatMemberReadEvent,
  type ChatMemberRemovedEvent,
  type ChatMemberRoleChangedEvent,
} from '../../../events/domain-events';
import { WsEmitter } from '../../../sockets/services/ws-emitter.service';

@Injectable()
export class ChatMemberEventsListener {
  constructor(
    private readonly wsEmitter: WsEmitter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatMemberEventsListener.name);
  }

  @OnEvent(DomainEvent.CHAT_MEMBER_ADDED)
  public handleMemberAdded(event: ChatMemberAddedEvent): void {
    this.logger.debug(
      'handleMemberAdded',
      { chatId: event.chatId, userId: event.member.userId },
      `Broadcasting ${ClientEvent.CHAT_MEMBER_ADDED}`,
    );

    this.wsEmitter.joinUserToChatRoom(event.member.userId, event.chatId);

    this.wsEmitter.toChatRoom(
      event.chatId,
      ClientEvent.CHAT_MEMBER_ADDED,
      event.member satisfies ChatMemberAddedPayload,
    );
  }

  @OnEvent(DomainEvent.CHAT_MEMBER_REMOVED)
  public handleMemberRemoved(event: ChatMemberRemovedEvent): void {
    this.logger.debug(
      'handleMemberRemoved',
      { chatId: event.chatId, userId: event.removedUserId },
      `Broadcasting ${ClientEvent.CHAT_MEMBER_REMOVED}`,
    );

    this.wsEmitter.toChatRoom(event.chatId, ClientEvent.CHAT_MEMBER_REMOVED, {
      chatId: event.chatId,
      userId: event.removedUserId,
    } satisfies ChatMemberRemovedPayload);

    this.wsEmitter.removeUserFromChatRoom(event.removedUserId, event.chatId);
  }

  @OnEvent(DomainEvent.CHAT_MEMBER_ROLE_CHANGED)
  public handleRoleChanged(event: ChatMemberRoleChangedEvent): void {
    this.logger.debug(
      'handleRoleChanged',
      {
        chatId: event.chatId,
        userId: event.member.userId,
        role: event.member.role,
      },
      `Broadcasting ${ClientEvent.CHAT_MEMBER_ROLE_CHANGED}`,
    );

    this.wsEmitter.toChatRoom(
      event.chatId,
      ClientEvent.CHAT_MEMBER_ROLE_CHANGED,
      event.member satisfies ChatMemberRoleChangedPayload,
    );
  }

  @OnEvent(DomainEvent.CHAT_MEMBER_READ)
  public handleRead(event: ChatMemberReadEvent): void {
    this.logger.debug(
      'handleRead',
      {
        chatId: event.chatId,
        userId: event.member.userId,
        lastReadAt: event.member.lastReadAt,
      },
      `Broadcasting ${ClientEvent.CHAT_MEMBER_READ}`,
    );

    this.wsEmitter.toChatRoom(
      event.chatId,
      ClientEvent.CHAT_MEMBER_READ,
      event.member satisfies ChatMemberReadPayload,
    );
  }
}
