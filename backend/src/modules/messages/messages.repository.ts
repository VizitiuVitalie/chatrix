import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { ChatMemberEntity } from '../chat-members/entities/chat-member.entity';
import { MessageEntity } from './entities/message.entity';

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repo: Repository<MessageEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessagesRepository.name);
  }

  public async findById(id: number): Promise<MessageEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { sender: { avatarFile: true }, files: true },
    });
  }

  public async findBySenderAndClientId(
    senderId: number,
    clientId: string,
  ): Promise<MessageEntity | null> {
    return this.repo.findOne({
      where: { senderId, clientId },
      relations: { sender: { avatarFile: true }, files: true },
    });
  }

  public async findPageByChatId(
    chatId: number,
    userId: number,
    before: number | undefined,
    limit: number,
  ): Promise<MessageEntity[]> {
    const qb = this.repo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('sender.avatarFile', 'senderAvatarFile')
      .leftJoinAndSelect('message.files', 'files')
      .innerJoin(
        ChatMemberEntity,
        'me',
        'me.chat_id = message.chat_id AND me.user_id = :userId',
        { userId },
      )
      .where('message.chat_id = :chatId', { chatId })
      .andWhere(
        '(me.chat_history_cleared_at IS NULL OR message.created_at >= me.chat_history_cleared_at)',
      )
      .orderBy('message.id', 'DESC')
      .take(limit);

    if (before !== undefined) {
      qb.andWhere('message.id < :before', { before });
    }

    return qb.getMany();
  }

  public async create(
    data: Partial<MessageEntity>,
    manager?: EntityManager,
  ): Promise<MessageEntity> {
    const repo = manager ? manager.getRepository(MessageEntity) : this.repo;

    const message = repo.create(data);

    const saved = await repo.save(message);

    this.logger.debug(
      'create',
      { messageId: saved.id, chatId: saved.chatId, senderId: saved.senderId },
      'Message created',
    );

    return saved;
  }

  public async update(
    id: number,
    patch: Partial<MessageEntity>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(MessageEntity) : this.repo;

    await repo.update(id, patch);

    this.logger.debug('update', { messageId: id }, 'Message updated');
  }

  public async hardDelete(id: number, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MessageEntity) : this.repo;

    await repo.delete(id);

    this.logger.debug('hardDelete', { messageId: id }, 'Message hard-deleted');
  }

  public async findLatestForChat(
    chatId: number,
    manager?: EntityManager,
  ): Promise<MessageEntity | null> {
    const repo = manager ? manager.getRepository(MessageEntity) : this.repo;

    return repo.findOne({
      where: { chatId },
      relations: { sender: { avatarFile: true } },
      order: { id: 'DESC' },
    });
  }
}
