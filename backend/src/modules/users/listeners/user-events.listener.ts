import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  ClientEvent,
  type UserUpdatedPayload,
} from '../../../events/client-events';
import {
  DomainEvent,
  type UserUpdatedEvent,
} from '../../../events/domain-events';
import { ChatMemberEntity } from '../../chat-members/entities/chat-member.entity';
import { WsEmitter } from '../../../sockets/services/ws-emitter.service';

@Injectable()
export class UserEventsListener {
  constructor(
    private readonly wsEmitter: WsEmitter,
    @InjectRepository(ChatMemberEntity)
    private readonly chatMembersRepo: Repository<ChatMemberEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserEventsListener.name);
  }

  @OnEvent(DomainEvent.USER_UPDATED)
  public async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    const memberships = await this.chatMembersRepo.find({
      where: { userId: event.user.id },
      select: ['chatId'],
    });

    this.logger.debug(
      'handleUserUpdated',
      { userId: event.user.id, chatCount: memberships.length },
      `Broadcasting ${ClientEvent.USER_UPDATED}`,
    );

    for (const membership of memberships) {
      this.wsEmitter.toChatRoom(
        membership.chatId,
        ClientEvent.USER_UPDATED,
        event.user satisfies UserUpdatedPayload,
      );
    }

    this.wsEmitter.toUser(
      event.user.id,
      ClientEvent.USER_UPDATED,
      event.user satisfies UserUpdatedPayload,
    );
  }
}
