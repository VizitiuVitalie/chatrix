import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { SessionEntity } from './entities/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SessionsRepository.name);
  }

  public async findById(id: number): Promise<SessionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findActiveByCurrentHash(
    hash: string,
  ): Promise<SessionEntity | null> {
    return this.repo.findOne({
      where: {
        refreshTokenHash: hash,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  public async findByPreviousHash(hash: string): Promise<SessionEntity | null> {
    return this.repo.findOne({
      where: { previousRefreshTokenHash: hash },
    });
  }

  public async findActiveByUserId(userId: number): Promise<SessionEntity[]> {
    return this.repo.find({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  public async create(data: Partial<SessionEntity>): Promise<SessionEntity> {
    const session = this.repo.create(data);
    const saved = await this.repo.save(session);
    this.logger.debug(
      'create',
      { sessionId: saved.id, userId: saved.userId },
      'Session created',
    );
    return saved;
  }

  public async rotateIfCurrent(
    id: number,
    expectedCurrentHash: string,
    newHash: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        refreshTokenHash: newHash,
        previousRefreshTokenHash: expectedCurrentHash,
        lastUsedAt: new Date(),
        ipAddress,
        userAgent,
      })
      .where('id = :id', { id })
      .andWhere('refresh_token_hash = :expectedCurrentHash', {
        expectedCurrentHash,
      })
      .andWhere('deleted_at IS NULL')
      .execute();

    const applied = (result.affected ?? 0) > 0;

    this.logger.debug(
      'rotateIfCurrent',
      { sessionId: id, applied },
      applied
        ? 'Refresh token rotated'
        : 'Refresh token rotation lost to concurrent request',
    );

    return applied;
  }

  public async revoke(id: number): Promise<void> {
    await this.repo.delete(id);
    this.logger.debug('revoke', { sessionId: id }, 'Session deleted');
  }

  public async revokeAllByUserId(userId: number): Promise<void> {
    const result = await this.repo.delete({ userId });
    this.logger.debug(
      'revokeAllByUserId',
      { userId, affected: result.affected ?? 0 },
      'All sessions deleted for user',
    );
  }

  public async purgeExpired(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected ?? 0;
  }
}
