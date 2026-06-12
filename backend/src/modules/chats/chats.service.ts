import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager } from 'typeorm';
import { isUniqueViolation } from '../../common/helpers/is-unique-violation.helper';
import { AppLogger } from '../../common/logger/app-logger.service';
import { StorageService } from '../../core/storage/storage.service';
import {
  DomainEvent,
  type ChatCreatedEvent,
  type ChatDeletedEvent,
  type ChatUpdatedEvent,
} from '../../events/domain-events';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { ChatMemberEntity } from '../chat-members/entities/chat-member.entity';
import { ChatMemberRole } from '../chat-members/enums/chat-member-role.enum';
import { FileEntity } from '../files/entities/file.entity';
import { FileKind } from '../files/enums/file-kind.enum';
import { MessageEntity } from '../messages/entities/message.entity';
import { UsersService } from '../users/users.service';
import { ChatsRepository } from './chats.repository';
import { ChatDto } from './dto/chat.dto';
import { ChatLastMessageDto } from './dto/chat-last-message.dto';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatEntity } from './entities/chat.entity';
import { ChatType } from './enums/chat-type.enum';
import { DeleteChatScope } from './enums/delete-chat-scope.enum';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly chatMembersService: ChatMembersService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatsService.name);
  }

  public async findChatAndActorMember(
    chatId: number,
    actorId: number,
  ): Promise<{ chat: ChatEntity; me: ChatMemberEntity }> {
    const chat = await this.chatsRepository.findByIdWithMembers(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const me = chat.members.find((m) => m.userId === actorId);
    if (!me) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return { chat, me };
  }

  public async getAvatarFileId(chatId: number): Promise<number | null> {
    const chat = await this.chatsRepository.findById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat.avatarFileId;
  }

  public async setAvatarFileId(
    chatId: number,
    fileId: number | null,
  ): Promise<void> {
    await this.chatsRepository.setAvatarFileId(chatId, fileId);
  }

  public async createDirect(
    userId: number,
    dto: CreateDirectChatDto,
  ): Promise<ChatDto> {
    const targetUserId = dto.targetUserId;
    if (targetUserId === userId) {
      throw new BadRequestException(
        'Cannot create a direct chat with yourself',
      );
    }

    const peer = await this.usersService.findById(targetUserId);
    if (!peer) {
      throw new NotFoundException('Target user not found');
    }

    const directKey = this.buildDirectKey(userId, targetUserId);

    const existing = await this.chatsRepository.findDirectByKey(directKey);
    if (existing) {
      this.logger.info(
        'createDirect',
        { userId, targetUserId, chatId: existing.id, existed: true },
        'Direct chat already exists, returning existing',
      );

      return this.toChatDto(existing);
    }

    try {
      const created = await this.dataSource.transaction(async (manager) => {
        const chat = await this.chatsRepository.create(
          {
            type: ChatType.DIRECT,
            directKey,
            createdById: userId,
          },
          manager,
        );

        await this.chatMembersService.createInternal(
          {
            chatId: chat.id,
            userId,
            role: ChatMemberRole.MEMBER,
          },
          manager,
        );

        await this.chatMembersService.createInternal(
          {
            chatId: chat.id,
            userId: targetUserId,
            role: ChatMemberRole.MEMBER,
          },
          manager,
        );

        return chat;
      });

      const withMembers = await this.chatsRepository.findByIdWithMembers(
        created.id,
      );

      const chatDto = this.toChatDto(withMembers!);

      this.logger.info(
        'createDirect',
        { userId, targetUserId, chatId: created.id, existed: false },
        'Direct chat created',
      );

      this.eventEmitter.emit(DomainEvent.CHAT_CREATED, {
        chat: chatDto,
      } satisfies ChatCreatedEvent);

      return chatDto;
    } catch (err) {
      if (isUniqueViolation(err)) {
        const fetched = await this.chatsRepository.findDirectByKey(directKey);
        if (fetched) {
          this.logger.info(
            'createDirect',
            { userId, targetUserId, chatId: fetched.id, raceResolved: true },
            'Direct chat race resolved via unique index',
          );

          return this.toChatDto(fetched);
        }
      }
      throw err;
    }
  }

  public async createGroup(
    userId: number,
    dto: CreateGroupChatDto,
  ): Promise<ChatDto> {
    if (dto.memberIds.includes(userId)) {
      throw new BadRequestException(
        'Do not include yourself in memberIds; creator is added automatically',
      );
    }

    const peers = await this.usersService.findManyByIds(dto.memberIds);
    if (peers.length !== dto.memberIds.length) {
      throw new NotFoundException('One or more target users were not found');
    }

    const trimmedName = dto.name.trim();
    if (trimmedName.length === 0) {
      throw new BadRequestException('Name must not be blank');
    }

    const created = await this.dataSource.transaction(async (manager) => {
      const chat = await this.chatsRepository.create(
        {
          type: ChatType.GROUP,
          name: trimmedName,
          createdById: userId,
        },
        manager,
      );

      await this.chatMembersService.createInternal(
        { chatId: chat.id, userId, role: ChatMemberRole.OWNER },
        manager,
      );

      for (const memberId of dto.memberIds) {
        await this.chatMembersService.createInternal(
          {
            chatId: chat.id,
            userId: memberId,
            role: ChatMemberRole.MEMBER,
          },
          manager,
        );
      }

      return chat;
    });

    const withMembers = await this.chatsRepository.findByIdWithMembers(
      created.id,
    );

    const chatDto = this.toChatDto(withMembers!);

    this.logger.info(
      'createGroup',
      { userId, chatId: created.id, memberCount: dto.memberIds.length + 1 },
      'Group chat created',
    );

    this.eventEmitter.emit(DomainEvent.CHAT_CREATED, {
      chat: chatDto,
    } satisfies ChatCreatedEvent);
    return chatDto;
  }

  public async findMyChats(userId: number): Promise<ChatDto[]> {
    const chats = await this.chatsRepository.findChatsForUser(userId);

    return chats.map((chat) => this.toChatDto(chat));
  }

  public async findOneForUser(
    userId: number,
    chatId: number,
  ): Promise<ChatDto> {
    const chat = await this.chatsRepository.findByIdWithMembers(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    this.requireMember(chat, userId);

    return this.toChatDto(chat);
  }

  public async update(
    actorId: number,
    chatId: number,
    dto: UpdateChatDto,
  ): Promise<ChatDto> {
    const chat = await this.chatsRepository.findByIdWithMembers(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const me = this.requireMember(chat, actorId);

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Direct chats do not have editable fields');
    }

    if (me.role !== ChatMemberRole.OWNER) {
      throw new ForbiddenException('Only the group owner can edit this chat');
    }

    const trimmedName = dto.name.trim();
    if (trimmedName.length === 0) {
      throw new BadRequestException('Name must not be blank');
    }

    await this.chatsRepository.update(chatId, { name: trimmedName });

    chat.name = trimmedName;

    if (chat.lastMessageId !== null) {
      chat.lastMessage =
        (await this.chatsRepository.findLastMessageWithSender(
          chat.lastMessageId,
        )) ?? chat.lastMessage;
    }

    const result = this.toChatDto(chat);

    this.logger.info(
      'update',
      { actorId, chatId, name: trimmedName },
      'Chat renamed',
    );

    this.eventEmitter.emit(DomainEvent.CHAT_UPDATED, {
      chat: result,
    } satisfies ChatUpdatedEvent);

    return result;
  }

  public async delete(
    actorId: number,
    chatId: number,
    scope: DeleteChatScope = DeleteChatScope.BOTH,
  ): Promise<void> {
    if (scope === DeleteChatScope.ME) {
      await this.clearChatHistoryForUser(actorId, chatId);

      return;
    }

    await this.hardDelete(actorId, chatId);
  }

  public async clearChatHistoryForUser(
    actorId: number,
    chatId: number,
  ): Promise<void> {
    const chat = await this.chatsRepository.findByIdWithMembers(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    this.requireMember(chat, actorId);

    if (chat.type !== ChatType.DIRECT) {
      throw new BadRequestException(
        'Per-user history clear is only supported on direct chats',
      );
    }

    await this.chatMembersService.clearChatHistory(actorId, chatId);

    this.logger.info(
      'clearChatHistoryForUser',
      { actorId, chatId },
      'Chat history cleared for caller',
    );
  }

  private async hardDelete(actorId: number, chatId: number): Promise<void> {
    const chat = await this.chatsRepository.findByIdWithAttachments(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const me = this.requireMember(chat, actorId);

    if (chat.type === ChatType.GROUP && me.role !== ChatMemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete a group chat');
    }

    const attachments: FileEntity[] = (chat.messages ?? []).flatMap(
      (m) => m.files ?? [],
    );

    await this.dataSource.transaction(async (manager) => {
      for (const file of attachments) {
        if (file.kind === FileKind.MESSAGE_ATTACHMENT) {
          await this.usersService.releaseQuota(
            file.uploadedById,
            file.sizeBytes,
            manager,
          );
        }
      }

      if (chat.avatarFile) {
        await manager.delete(FileEntity, chat.avatarFile.id);
      }

      await this.chatsRepository.hardDelete(chatId, manager);
    });

    const s3Keys = [
      ...attachments.flatMap((f) =>
        f.thumbnailStorageKey
          ? [f.storageKey, f.thumbnailStorageKey]
          : [f.storageKey],
      ),
      ...(chat.avatarFile
        ? chat.avatarFile.thumbnailStorageKey
          ? [chat.avatarFile.storageKey, chat.avatarFile.thumbnailStorageKey]
          : [chat.avatarFile.storageKey]
        : []),
    ];
    for (const key of s3Keys) {
      await this.storage.delete(key).catch(() => undefined);
    }

    this.logger.info(
      'hardDelete',
      {
        actorId,
        chatId,
        type: chat.type,
        attachmentCount: attachments.length,
        s3KeysCleaned: s3Keys.length,
      },
      'Chat hard-deleted',
    );
    this.eventEmitter.emit(DomainEvent.CHAT_DELETED, {
      chatId,
    } satisfies ChatDeletedEvent);
  }

  public async findChatEntity(chatId: number): Promise<ChatEntity | null> {
    return this.chatsRepository.findById(chatId);
  }

  public async bumpLastMessage(
    chatId: number,
    lastMessageId: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this.chatsRepository.bumpLastMessage(chatId, lastMessageId, manager);
  }

  public async setLastMessageId(
    chatId: number,
    lastMessageId: number | null,
    manager?: EntityManager,
  ): Promise<void> {
    await this.chatsRepository.setLastMessageId(chatId, lastMessageId, manager);
  }

  public async findChatIdsForUser(userId: number): Promise<number[]> {
    return this.chatsRepository.findChatIdsForUser(userId);
  }

  private buildDirectKey(a: number, b: number): string {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}:${max}`;
  }

  private requireMember(chat: ChatEntity, userId: number): ChatMemberEntity {
    const member = chat.members?.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    return member;
  }

  private toChatDto(chat: ChatEntity): ChatDto {
    const dto = plainToInstance(ChatDto, chat, {
      excludeExtraneousValues: true,
    });

    dto.avatarUrl = chat.avatarFile
      ? this.storage.getPublicUrl(chat.avatarFile.storageKey)
      : null;

    dto.thumbnailUrl = chat.avatarFile?.thumbnailStorageKey
      ? this.storage.getPublicUrl(chat.avatarFile.thumbnailStorageKey)
      : null;

    dto.lastMessage = chat.lastMessage
      ? this.toLastMessageDto(chat.lastMessage)
      : null;

    for (let i = 0; i < (chat.members?.length ?? 0); i += 1) {
      const memberDto = dto.members[i];
      const memberEntity = chat.members[i];

      if (memberDto?.user && memberEntity?.user) {
        this.usersService.hydrateNestedUser(memberDto.user, memberEntity.user);
      }
    }

    return dto;
  }

  public toLastMessageDto(message: MessageEntity): ChatLastMessageDto {
    const dto = plainToInstance(ChatLastMessageDto, message, {
      excludeExtraneousValues: true,
    });
    dto.senderNickname = message.sender?.nickname ?? '';
    return dto;
  }
}
