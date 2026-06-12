import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { DataSource } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { isUniqueViolation } from '../../common/helpers/is-unique-violation.helper';
import {
  DomainEvent,
  type MessageCreatedEvent,
  type MessageDeletedEvent,
  type MessageEditedEvent,
} from '../../events/domain-events';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { ChatMemberRole } from '../chat-members/enums/chat-member-role.enum';
import { ChatsService } from '../chats/chats.service';
import { ChatType } from '../chats/enums/chat-type.enum';
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { MessageDto } from './dto/message.dto';
import { MessagesPageDto } from './dto/messages-page.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageEntity } from './entities/message.entity';
import {
  DEFAULT_MESSAGE_PAGE_LIMIT,
  EDIT_WINDOW_MS,
  SENDER_DELETE_WINDOW_MS,
} from './constants/messages.constants';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly chatsService: ChatsService,
    private readonly chatMembersService: ChatMembersService,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessagesService.name);
  }

  public async send(
    userId: number,
    dto: CreateMessageDto,
  ): Promise<MessageDto> {
    await this.assertChatExists(dto.chatId);
    await this.assertMembership(userId, dto.chatId);

    const hasContent =
      typeof dto.content === 'string' && dto.content.length > 0;

    const hasFiles = (dto.fileIds?.length ?? 0) > 0;

    if (!hasContent && !hasFiles) {
      throw new BadRequestException(
        'message must include either content or at least one file attachment',
      );
    }

    if (dto.clientId) {
      const existing = await this.messagesRepository.findBySenderAndClientId(
        userId,
        dto.clientId,
      );

      if (existing) {
        this.logger.info(
          'send',
          { userId, chatId: dto.chatId, messageId: existing.id },
          'Idempotent send — returning existing message',
        );

        return this.toMessageDto(existing);
      }
    }

    let created: MessageEntity;
    try {
      created = await this.dataSource.transaction(async (manager) => {
        const message = await this.messagesRepository.create(
          {
            chatId: dto.chatId,
            senderId: userId,
            content: dto.content ?? null,
            clientId: dto.clientId ?? null,
          },
          manager,
        );
        if (dto.fileIds && dto.fileIds.length > 0) {
          await this.filesService.claimFilesForMessage(
            userId,
            dto.fileIds,
            message.id,
            manager,
          );
        }
        await this.chatsService.bumpLastMessage(
          dto.chatId,
          message.id,
          manager,
        );

        return message;
      });
    } catch (error) {
      if (dto.clientId && isUniqueViolation(error)) {
        const existing = await this.messagesRepository.findBySenderAndClientId(
          userId,
          dto.clientId,
        );

        if (existing) {
          this.logger.info(
            'send',
            { userId, chatId: dto.chatId, messageId: existing.id },
            'Idempotent send (race) — returning existing message',
          );

          return this.toMessageDto(existing);
        }
      }

      throw error;
    }

    const full = await this.messagesRepository.findById(created.id);
    if (!full) {
      throw new InternalServerErrorException(
        'Message disappeared immediately after creation',
      );
    }

    const messageDto = this.toMessageDto(full);

    this.logger.info(
      'send',
      {
        userId,
        chatId: dto.chatId,
        messageId: created.id,
        fileCount: dto.fileIds?.length ?? 0,
      },
      'Message sent',
    );

    this.eventEmitter.emit(DomainEvent.MESSAGE_CREATED, {
      chatId: dto.chatId,
      message: messageDto,
    } satisfies MessageCreatedEvent);

    return messageDto;
  }

  public async list(
    userId: number,
    query: ListMessagesQueryDto,
  ): Promise<MessagesPageDto> {
    await this.assertChatExists(query.chatId);
    await this.assertMembership(userId, query.chatId);

    const limit = query.limit ?? DEFAULT_MESSAGE_PAGE_LIMIT;
    const messages = await this.messagesRepository.findPageByChatId(
      query.chatId,
      userId,
      query.before,
      limit,
    );

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    const items = messages.map((m) => this.toMessageDto(m));
    return new MessagesPageDto({ items, nextCursor });
  }

  public async edit(
    actorId: number,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<MessageDto> {
    const message = await this.messagesRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.assertCanModifyMessage(actorId, message, EDIT_WINDOW_MS, 'edit');

    await this.messagesRepository.update(messageId, {
      content: dto.content,
      editedAt: new Date(),
    });

    const full = await this.messagesRepository.findById(messageId);
    if (!full) {
      throw new InternalServerErrorException(
        'Message disappeared immediately after edit',
      );
    }

    const messageDto = this.toMessageDto(full);

    this.logger.info(
      'edit',
      { userId: actorId, chatId: message.chatId, messageId },
      'Message edited',
    );

    this.eventEmitter.emit(DomainEvent.MESSAGE_EDITED, {
      chatId: message.chatId,
      message: messageDto,
    } satisfies MessageEditedEvent);

    return messageDto;
  }

  public async delete(actorId: number, messageId: number): Promise<void> {
    const message = await this.messagesRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.assertCanModifyMessage(
      actorId,
      message,
      SENDER_DELETE_WINDOW_MS,
      'delete',
    );

    const chat = await this.chatsService.findChatEntity(message.chatId);
    const wasChatLast = chat?.lastMessageId === messageId;

    const newLastMessageEntity = await this.dataSource.transaction(
      async (manager) => {
        await this.filesService.deleteByMessageId(messageId);

        await this.messagesRepository.hardDelete(messageId, manager);

        if (!wasChatLast) return null;

        const latest = await this.messagesRepository.findLatestForChat(
          message.chatId,
          manager,
        );
        if (latest) {
          await this.chatsService.setLastMessageId(
            message.chatId,
            latest.id,
            manager,
          );
        }

        return latest;
      },
    );

    this.logger.info(
      'delete',
      {
        actor: actorId,
        chatId: message.chatId,
        messageId,
        bySender: message.senderId === actorId,
        repointedTo: newLastMessageEntity?.id ?? null,
      },
      'Message deleted',
    );

    const newLastMessage = newLastMessageEntity
      ? this.chatsService.toLastMessageDto(newLastMessageEntity)
      : null;

    this.eventEmitter.emit(DomainEvent.MESSAGE_DELETED, {
      chatId: message.chatId,
      messageId,
      newLastMessage: wasChatLast ? newLastMessage : null,
    } satisfies MessageDeletedEvent);
  }

  private async assertChatExists(chatId: number): Promise<void> {
    const chat = await this.chatsService.findChatEntity(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
  }

  private async assertMembership(
    userId: number,
    chatId: number,
  ): Promise<void> {
    const membership = await this.chatMembersService.findMembership(
      userId,
      chatId,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }
  }

  private async assertCanModifyMessage(
    actorId: number,
    message: MessageEntity,
    windowMs: number,
    op: 'edit' | 'delete',
  ): Promise<void> {
    const isSender = message.senderId === actorId;
    const ageMs = Date.now() - message.createdAt.getTime();
    const withinWindow = ageMs <= windowMs;

    if (isSender && withinWindow) {
      return;
    }

    const expiredMessage =
      op === 'edit'
        ? `Edit window has expired (${Math.round(windowMs / 60_000)} minutes after sending)`
        : `Delete window has expired (${Math.round(windowMs / 60_000)} minutes after sending)`;

    const notOwnInDirectMessage =
      op === 'edit'
        ? 'You can only edit your own messages in a direct chat'
        : 'You can only delete your own messages in a direct chat';

    const chat = await this.chatsService.findChatEntity(message.chatId);

    if (!chat || chat.type !== ChatType.GROUP) {
      throw new ForbiddenException(
        isSender ? expiredMessage : notOwnInDirectMessage,
      );
    }

    const actorMembership = await this.chatMembersService.findMembership(
      actorId,
      message.chatId,
    );
    if (!actorMembership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const actorIsAdminOrOwner =
      actorMembership.role === ChatMemberRole.OWNER ||
      actorMembership.role === ChatMemberRole.ADMIN;

    if (!actorIsAdminOrOwner) {
      throw new ForbiddenException(
        isSender ? expiredMessage : `You can only ${op} your own messages`,
      );
    }

    if (isSender) {
      return;
    }

    if (op === 'edit') {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (actorMembership.role === ChatMemberRole.OWNER) {
      return;
    }

    const senderMembership = await this.chatMembersService.findMembership(
      message.senderId,
      message.chatId,
    );

    const senderRole = senderMembership?.role ?? ChatMemberRole.MEMBER;

    if (senderRole === ChatMemberRole.OWNER) {
      throw new ForbiddenException("Admins cannot delete the owner's messages");
    }

    if (senderRole === ChatMemberRole.ADMIN) {
      throw new ForbiddenException(
        "Admins cannot delete another admin's messages",
      );
    }
  }

  private toMessageDto(message: MessageEntity): MessageDto {
    const dto = plainToInstance(MessageDto, message, {
      excludeExtraneousValues: true,
    });

    dto.files = (message.files ?? []).map((file) =>
      this.filesService.toDto(file),
    );

    if (dto.sender && message.sender) {
      this.usersService.hydrateNestedUser(dto.sender, message.sender);
    }

    return dto;
  }
}
