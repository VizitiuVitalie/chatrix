import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { isUniqueViolation } from '../../common/helpers/is-unique-violation.helper';
import {
  DomainEvent,
  type ChatMemberAddedEvent,
  type ChatMemberReadEvent,
  type ChatMemberRemovedEvent,
  type ChatMemberRoleChangedEvent,
} from '../../events/domain-events';
import { ChatEntity } from '../chats/entities/chat.entity';
import { ChatType } from '../chats/enums/chat-type.enum';
import { UsersService } from '../users/users.service';
import { ChatMembersRepository } from './chat-members.repository';
import { AddChatMemberDto } from './dto/add-chat-member.dto';
import { ChatMemberDto } from './dto/chat-member.dto';
import { UpdateChatMemberRoleDto } from './dto/update-chat-member-role.dto';
import { ChatMemberEntity } from './entities/chat-member.entity';
import { ChatMemberRole } from './enums/chat-member-role.enum';

@Injectable()
export class ChatMembersService {
  constructor(
    private readonly chatMembersRepository: ChatMembersRepository,
    @InjectRepository(ChatEntity)
    private readonly chatRepo: Repository<ChatEntity>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatMembersService.name);
  }

  public async createInternal(
    data: Partial<ChatMemberEntity>,
    manager?: EntityManager,
  ): Promise<ChatMemberEntity> {
    return this.chatMembersRepository.create(data, manager);
  }

  public async clearChatHistory(userId: number, chatId: number): Promise<void> {
    await this.chatMembersRepository.markChatHistoryCleared(chatId, userId);
  }

  public async findMembership(
    userId: number,
    chatId: number,
  ): Promise<ChatMemberEntity | null> {
    return this.chatMembersRepository.findOne(chatId, userId);
  }

  public async findChatParticipantIds(chatId: number): Promise<number[]> {
    return this.chatMembersRepository.findUserIdsByChatId(chatId);
  }

  public async addMember(
    actorId: number,
    dto: AddChatMemberDto,
  ): Promise<ChatMemberDto> {
    await this.assertGroupChat(dto.chatId);
    await this.assertAdminOrOwner(dto.chatId, actorId);

    if (dto.userId === actorId) {
      throw new BadRequestException('You are already in this chat');
    }

    const existing = await this.chatMembersRepository.findOne(
      dto.chatId,
      dto.userId,
    );

    if (existing) {
      throw new ConflictException('User is already a member of this chat');
    }

    const target = await this.usersService.findById(dto.userId);

    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    try {
      await this.chatMembersRepository.create({
        chatId: dto.chatId,
        userId: dto.userId,
        role: dto.role ?? ChatMemberRole.MEMBER,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('User is already a member of this chat');
      }

      throw err;
    }

    this.logger.info(
      'addMember',
      { actor: actorId, chatId: dto.chatId, addedUserId: dto.userId },
      'Chat member added',
    );

    const created = await this.chatMembersRepository.findOneWithUser(
      dto.chatId,
      dto.userId,
    );

    const memberDto = this.toDto(created!);

    this.eventEmitter.emit(DomainEvent.CHAT_MEMBER_ADDED, {
      chatId: dto.chatId,
      member: memberDto,
    } satisfies ChatMemberAddedEvent);

    return memberDto;
  }

  public async removeMember(actorId: number, memberId: number): Promise<void> {
    const target = await this.chatMembersRepository.findById(memberId);

    if (!target) {
      throw new NotFoundException('Chat member not found');
    }

    await this.assertGroupChat(target.chatId);

    const me = await this.findMyMembershipOr403(target.chatId, actorId);

    if (target.userId !== actorId) {
      if (target.role === ChatMemberRole.OWNER) {
        throw new ForbiddenException(
          'Cannot remove the owner — transfer ownership first',
        );
      }

      if (me.role === ChatMemberRole.MEMBER) {
        throw new ForbiddenException('Members cannot remove others');
      }

      if (
        target.role === ChatMemberRole.ADMIN &&
        me.role !== ChatMemberRole.OWNER
      ) {
        throw new ForbiddenException('Only the owner can remove an admin');
      }
    } else if (me.role === ChatMemberRole.OWNER) {
      throw new ForbiddenException(
        'Owner cannot leave — transfer ownership first',
      );
    }

    await this.chatMembersRepository.remove(target.chatId, target.userId);

    this.logger.info(
      'removeMember',
      {
        actor: actorId,
        chatId: target.chatId,
        removedUserId: target.userId,
        memberId,
      },
      'Chat member removed',
    );

    this.eventEmitter.emit(DomainEvent.CHAT_MEMBER_REMOVED, {
      chatId: target.chatId,
      removedUserId: target.userId,
    } satisfies ChatMemberRemovedEvent);
  }

  public async updateRole(
    actorId: number,
    memberId: number,
    dto: UpdateChatMemberRoleDto,
  ): Promise<ChatMemberDto> {
    const target = await this.chatMembersRepository.findById(memberId);

    if (!target) {
      throw new NotFoundException('Chat member not found');
    }

    await this.assertGroupChat(target.chatId);

    const me = await this.findMyMembershipOr403(target.chatId, actorId);

    if (me.role !== ChatMemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can change member roles');
    }

    if (dto.role === ChatMemberRole.OWNER) {
      if (target.userId === actorId) {
        throw new BadRequestException('You are already the owner');
      }

      await this.dataSource.transaction(async (manager) => {
        await this.chatMembersRepository.updateRole(
          target.chatId,
          target.userId,
          ChatMemberRole.OWNER,
          manager,
        );

        await this.chatMembersRepository.updateRole(
          target.chatId,
          actorId,
          ChatMemberRole.ADMIN,
          manager,
        );
      });

      this.logger.info(
        'updateRole',
        { actor: actorId, chatId: target.chatId, newOwnerId: target.userId },
        'Chat ownership transferred',
      );

      const demoted = await this.chatMembersRepository.findOneWithUser(
        target.chatId,
        actorId,
      );

      this.eventEmitter.emit(DomainEvent.CHAT_MEMBER_ROLE_CHANGED, {
        chatId: target.chatId,
        member: this.toDto(demoted!),
      } satisfies ChatMemberRoleChangedEvent);
    } else {
      if (target.role === ChatMemberRole.OWNER) {
        throw new ForbiddenException(
          'Demote the owner by promoting someone else first',
        );
      }

      if (dto.role === target.role) {
        const current = await this.chatMembersRepository.findOneWithUser(
          target.chatId,
          target.userId,
        );

        return this.toDto(current!);
      }

      await this.chatMembersRepository.updateRole(
        target.chatId,
        target.userId,
        dto.role,
      );

      this.logger.info(
        'updateRole',
        {
          actor: actorId,
          chatId: target.chatId,
          targetUserId: target.userId,
          role: dto.role,
        },
        'Chat member role updated',
      );
    }

    const updated = await this.chatMembersRepository.findOneWithUser(
      target.chatId,
      target.userId,
    );

    const memberDto = this.toDto(updated!);

    this.eventEmitter.emit(DomainEvent.CHAT_MEMBER_ROLE_CHANGED, {
      chatId: target.chatId,
      member: memberDto,
    } satisfies ChatMemberRoleChangedEvent);
    return memberDto;
  }

  public async markRead(
    actorId: number,
    chatId: number,
  ): Promise<ChatMemberDto> {
    await this.assertChatExists(chatId);
    await this.findMyMembershipOr403(chatId, actorId);

    await this.chatMembersRepository.markRead(chatId, actorId, new Date());

    this.logger.info(
      'markRead',
      { userId: actorId, chatId },
      'Chat marked as read',
    );

    const updated = await this.chatMembersRepository.findOneWithUser(
      chatId,
      actorId,
    );

    const memberDto = this.toDto(updated!);

    this.eventEmitter.emit(DomainEvent.CHAT_MEMBER_READ, {
      chatId,
      member: memberDto,
    } satisfies ChatMemberReadEvent);

    return memberDto;
  }

  private async assertChatExists(chatId: number): Promise<ChatEntity> {
    const chat = await this.chatRepo.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  private async assertGroupChat(chatId: number): Promise<ChatEntity> {
    const chat = await this.assertChatExists(chatId);

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException(
        'Members can only be managed on group chats',
      );
    }

    return chat;
  }

  private async findMyMembershipOr403(
    chatId: number,
    userId: number,
  ): Promise<ChatMemberEntity> {
    const member = await this.chatMembersRepository.findOne(chatId, userId);

    if (!member) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return member;
  }

  private async assertAdminOrOwner(
    chatId: number,
    userId: number,
  ): Promise<void> {
    const member = await this.findMyMembershipOr403(chatId, userId);

    if (member.role === ChatMemberRole.MEMBER) {
      throw new ForbiddenException('Admin or owner role required');
    }
  }

  private toDto(member: ChatMemberEntity): ChatMemberDto {
    const dto = plainToInstance(ChatMemberDto, member, {
      excludeExtraneousValues: true,
    });

    if (dto.user && member.user) {
      this.usersService.hydrateNestedUser(dto.user, member.user);
    }

    return dto;
  }
}
