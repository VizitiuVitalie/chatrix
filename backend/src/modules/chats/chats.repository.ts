import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { MessageEntity } from '../messages/entities/message.entity';
import { ChatEntity } from './entities/chat.entity';
import { ChatType } from './enums/chat-type.enum';

@Injectable()
export class ChatsRepository {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly repo: Repository<ChatEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatsRepository.name);
  }

  public async findById(id: number): Promise<ChatEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findByIdWithMembers(id: number): Promise<ChatEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        members: { user: { avatarFile: true } },
        avatarFile: true,
      },
    });
  }

  public async findLastMessageWithSender(
    messageId: number,
  ): Promise<MessageEntity | null> {
    return this.repo.manager.getRepository(MessageEntity).findOne({
      where: { id: messageId },
      relations: { sender: true },
    });
  }

  public async findByIdWithAttachments(id: number): Promise<ChatEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        members: true,
        avatarFile: true,
        messages: { files: true },
      },
    });
  }

  public async findDirectByKey(directKey: string): Promise<ChatEntity | null> {
    return this.repo.findOne({
      where: { directKey, type: ChatType.DIRECT },
      relations: {
        members: { user: { avatarFile: true } },
        avatarFile: true,
      },
    });
  }

  public async findChatIdsForUser(userId: number): Promise<number[]> {
    const rows = await this.repo
      .createQueryBuilder('chat')
      .select('chat.id', 'id')
      .innerJoin('chat.members', 'me', 'me.user_id = :userId', { userId })
      .getRawMany<{ id: number }>();
    return rows.map((r) => r.id);
  }

  public async findChatsForUser(userId: number): Promise<ChatEntity[]> {
    return this.repo
      .createQueryBuilder('chat')
      .innerJoin('chat.members', 'me', 'me.user_id = :userId', { userId })
      .leftJoinAndSelect('chat.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('user.avatarFile', 'userAvatarFile')
      .leftJoinAndSelect('chat.avatarFile', 'avatarFile')
      .leftJoinAndSelect('chat.lastMessage', 'lastMessage')
      .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender')
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(MessageEntity, 'm')
          .where('m.chat_id = chat.id')
          .andWhere('m.created_at >= me.chat_history_cleared_at')
          .getQuery();
        return `(me.chat_history_cleared_at IS NULL OR EXISTS ${sub})`;
      })
      .orderBy('chat.updated_at', 'DESC')
      .getMany();
  }

  public async create(
    data: Partial<ChatEntity>,
    manager?: EntityManager,
  ): Promise<ChatEntity> {
    const repo = manager ? manager.getRepository(ChatEntity) : this.repo;

    const chat = repo.create(data);

    const saved = await repo.save(chat);

    this.logger.debug(
      'create',
      { chatId: saved.id, type: saved.type },
      'Chat created',
    );

    return saved;
  }

  public async update(
    id: number,
    data: Partial<ChatEntity>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ChatEntity) : this.repo;
    await repo.update(id, data);
    this.logger.debug('update', { chatId: id }, 'Chat updated');
  }

  public async hardDelete(id: number, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(ChatEntity) : this.repo;

    await repo.delete(id);

    this.logger.debug('hardDelete', { chatId: id }, 'Chat hard-deleted');
  }

  public async setAvatarFileId(
    chatId: number,
    fileId: number | null,
  ): Promise<void> {
    await this.repo.update(chatId, { avatarFileId: fileId });
  }

  public async bumpLastMessage(
    chatId: number,
    lastMessageId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ChatEntity) : this.repo;
    await repo.update(chatId, { lastMessageId, updatedAt: new Date() });
    this.logger.debug(
      'bumpLastMessage',
      { chatId, lastMessageId },
      'Chat last-message pointer bumped',
    );
  }

  public async setLastMessageId(
    chatId: number,
    lastMessageId: number | null,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ChatEntity) : this.repo;

    await repo.update(chatId, { lastMessageId });

    this.logger.debug(
      'setLastMessageId',
      { chatId, lastMessageId },
      'Chat last-message pointer set',
    );
  }
}
