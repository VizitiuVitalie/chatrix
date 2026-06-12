import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsOrder,
  In,
  IsNull,
  LessThan,
  Repository,
} from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { FileEntity } from './entities/file.entity';
import { FileKind } from './enums/file-kind.enum';
import { FileSort } from './enums/file-sort.enum';

@Injectable()
export class FilesRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly repo: Repository<FileEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FilesRepository.name);
  }

  public async findById(id: number): Promise<FileEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findByIdWithMessage(id: number): Promise<FileEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { message: true },
    });
  }

  public async findByIds(ids: number[]): Promise<FileEntity[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  public async findByMessageId(messageId: number): Promise<FileEntity[]> {
    return this.repo.find({ where: { messageId } });
  }

  public async create(data: Partial<FileEntity>): Promise<FileEntity> {
    const file = this.repo.create(data);
    const saved = await this.repo.save(file);

    this.logger.debug(
      'create',
      {
        id: saved.id,
        kind: saved.kind,
        key: saved.storageKey,
        size: saved.sizeBytes,
      },
      'File row created',
    );

    return saved;
  }

  public async findPageForUser(
    userId: number,
    sort: FileSort,
    page: number,
    limit: number,
  ): Promise<{ items: FileEntity[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { uploadedById: userId, kind: FileKind.MESSAGE_ATTACHMENT },
      order: this.buildOrder(sort),
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  public async hardDelete(id: number): Promise<void> {
    await this.repo.delete(id);
    this.logger.debug('hardDelete', { id }, 'File row hard-deleted');
  }

  public async sweepOrphanAttachments(
    olderThan: Date,
    manager: EntityManager,
  ): Promise<FileEntity[]> {
    const filesRepo = manager.getRepository(FileEntity);

    const orphans = await filesRepo.find({
      where: {
        messageId: IsNull(),
        kind: FileKind.MESSAGE_ATTACHMENT,
        createdAt: LessThan(olderThan),
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (orphans.length === 0) return [];

    await filesRepo.remove(orphans);

    this.logger.debug(
      'sweepOrphanAttachments',
      { count: orphans.length },
      'Orphan attachments hard-deleted',
    );

    return orphans;
  }

  public async sweepOrphanAvatars(
    olderThan: Date,
    manager: EntityManager,
  ): Promise<FileEntity[]> {
    const filesRepo = manager.getRepository(FileEntity);

    const candidates = await filesRepo
      .createQueryBuilder('file')
      .leftJoin('users', 'u', 'u.avatar_file_id = file.id')
      .leftJoin('chats', 'c', 'c.avatar_file_id = file.id')
      .where('file.kind IN (:...kinds)', {
        kinds: [FileKind.USER_AVATAR, FileKind.CHAT_AVATAR],
      })
      .andWhere('file.created_at < :olderThan', { olderThan })
      .andWhere('u.id IS NULL')
      .andWhere('c.id IS NULL')
      .setLock('pessimistic_write')
      .getMany();

    if (candidates.length === 0) return [];

    await filesRepo.remove(candidates);

    this.logger.debug(
      'sweepOrphanAvatars',
      { count: candidates.length },
      'Orphan avatars hard-deleted',
    );

    return candidates;
  }

  public async claimFilesForMessage(
    uploaderId: number,
    fileIds: number[],
    messageId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager ? manager.getRepository(FileEntity) : this.repo;

    const result = await repo
      .createQueryBuilder()
      .update(FileEntity)
      .set({ messageId })
      .where('id IN (:...ids)', { ids: fileIds })
      .andWhere('uploaded_by_id = :uploaderId', { uploaderId })
      .andWhere('message_id IS NULL')
      .andWhere('kind = :kind', { kind: FileKind.MESSAGE_ATTACHMENT })
      .execute();

    const affected = result.affected ?? 0;

    this.logger.debug(
      'claimFilesForMessage',
      { messageId, uploaderId, requested: fileIds.length, affected },
      'Files claimed by message',
    );

    return affected;
  }

  private buildOrder(sort: FileSort): FindOptionsOrder<FileEntity> {
    switch (sort) {
      case FileSort.SIZE_DESC:
        return { sizeBytes: 'DESC', id: 'DESC' };

      case FileSort.SIZE_ASC:
        return { sizeBytes: 'ASC', id: 'DESC' };

      case FileSort.CREATED_DESC:
        return { createdAt: 'DESC', id: 'DESC' };

      case FileSort.CREATED_ASC:
        return { createdAt: 'ASC', id: 'DESC' };
    }
  }
}
