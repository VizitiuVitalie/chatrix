import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { ChatMemberEntity } from './entities/chat-member.entity';
import { ChatMemberRole } from './enums/chat-member-role.enum';

@Injectable()
export class ChatMembersRepository {
  constructor(
    @InjectRepository(ChatMemberEntity)
    private readonly repo: Repository<ChatMemberEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatMembersRepository.name);
  }

  public async findOne(
    chatId: number,
    userId: number,
  ): Promise<ChatMemberEntity | null> {
    return this.repo.findOne({ where: { chatId, userId } });
  }

  public async findOneWithUser(
    chatId: number,
    userId: number,
  ): Promise<ChatMemberEntity | null> {
    return this.repo.findOne({
      where: { chatId, userId },
      relations: { user: { avatarFile: true } },
    });
  }

  public async findById(id: number): Promise<ChatMemberEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findUserIdsByChatId(chatId: number): Promise<number[]> {
    const rows = await this.repo.find({
      where: { chatId },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  public async create(
    data: Partial<ChatMemberEntity>,
    manager?: EntityManager,
  ): Promise<ChatMemberEntity> {
    const repo = manager ? manager.getRepository(ChatMemberEntity) : this.repo;

    const member = repo.create(data);

    const saved = await repo.save(member);

    this.logger.debug(
      'create',
      { chatId: saved.chatId, userId: saved.userId, role: saved.role },
      'Chat member added',
    );

    return saved;
  }

  public async updateRole(
    chatId: number,
    userId: number,
    role: ChatMemberRole,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ChatMemberEntity) : this.repo;

    await repo.update({ chatId, userId }, { role });

    this.logger.debug(
      'updateRole',
      { chatId, userId, role },
      'Chat member role updated',
    );
  }

  public async markRead(
    chatId: number,
    userId: number,
    readAt: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ChatMemberEntity) : this.repo;
    await repo.update({ chatId, userId }, { lastReadAt: readAt });
    this.logger.debug(
      'markRead',
      { chatId, userId, readAt },
      'Chat member lastReadAt updated',
    );
  }

  public async remove(chatId: number, userId: number): Promise<void> {
    await this.repo.delete({ chatId, userId });
    this.logger.debug('remove', { chatId, userId }, 'Chat member removed');
  }

  public async markChatHistoryCleared(
    chatId: number,
    userId: number,
  ): Promise<void> {
    await this.repo.update(
      { chatId, userId },
      { chatHistoryClearedAt: new Date() },
    );

    this.logger.debug(
      'markChatHistoryCleared',
      { chatId, userId },
      'Chat history cleared for member',
    );
  }
}
