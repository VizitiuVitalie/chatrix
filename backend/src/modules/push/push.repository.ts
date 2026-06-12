import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';

@Injectable()
export class PushRepository {
  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly repo: Repository<PushSubscriptionEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PushRepository.name);
  }

  public async upsertByEndpoint(
    data: Partial<PushSubscriptionEntity>,
  ): Promise<PushSubscriptionEntity> {
    const existing = await this.repo.findOne({
      where: { endpoint: data.endpoint },
    });

    if (existing && existing.userId !== data.userId) {
      this.logger.warn(
        'upsertByEndpoint',
        {
          endpoint: data.endpoint,
          previousUserId: existing.userId,
          newUserId: data.userId,
        },
        'Push endpoint ownership changed — prior session likely did not unsubscribe cleanly',
      );
    }

    await this.repo.upsert(data, {
      conflictPaths: ['endpoint'],
      skipUpdateIfNoValuesChanged: true,
    });

    const saved = await this.repo.findOne({
      where: { endpoint: data.endpoint },
    });

    if (!saved) {
      throw new InternalServerErrorException(
        'Push subscription disappeared right after upsert',
      );
    }

    this.logger.debug(
      'upsertByEndpoint',
      { id: saved.id, userId: saved.userId, sessionId: saved.sessionId },
      'Push subscription upserted',
    );

    return saved;
  }

  public async findByUserId(userId: number): Promise<PushSubscriptionEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async findByUserIds(
    userIds: number[],
  ): Promise<PushSubscriptionEntity[]> {
    if (userIds.length === 0) {
      return [];
    }

    return this.repo
      .createQueryBuilder('subscription')
      .innerJoin('subscription.user', 'user')
      .where('subscription.user_id IN (:...userIds)', { userIds })
      .andWhere('user.push_enabled = :enabled', { enabled: true })
      .getMany();
  }

  public async deleteById(id: number): Promise<void> {
    await this.repo.delete(id);
    this.logger.debug('deleteById', { id }, 'Push subscription deleted');
  }

  public async deleteBySessionId(sessionId: number): Promise<number> {
    const result = await this.repo.delete({ sessionId });
    const affected = result.affected ?? 0;
    this.logger.debug(
      'deleteBySessionId',
      { sessionId, affected },
      'Push subscriptions deleted by session',
    );
    return affected;
  }

  public async deleteByUserId(userId: number): Promise<number> {
    const result = await this.repo.delete({ userId });
    const affected = result.affected ?? 0;
    this.logger.debug(
      'deleteByUserId',
      { userId, affected },
      'Push subscriptions deleted by user',
    );
    return affected;
  }

  public async deleteByEndpointAndUser(
    endpoint: string,
    userId: number,
  ): Promise<number> {
    const result = await this.repo.delete({ endpoint, userId });
    const affected = result.affected ?? 0;

    this.logger.debug(
      'deleteByEndpointAndUser',
      { userId, affected },
      'Push subscription delete by endpoint',
    );

    return affected;
  }
}
