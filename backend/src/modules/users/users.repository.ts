import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  public async findById(id: number): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async findByIdWithAvatar(id: number): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { avatarFile: true },
    });
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { username },
      relations: { avatarFile: true },
    });
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  public async findManyByIds(ids: number[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  public async searchByQuery(
    pattern: string,
    limit: number,
    excludeUserId: number,
  ): Promise<UserEntity[]> {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.avatarFile', 'avatarFile')
      .where('user.id != :excludeUserId', { excludeUserId })
      .andWhere(
        '(user.username ILIKE :pattern OR user.nickname ILIKE :pattern)',
        {
          pattern,
        },
      )
      .orderBy('user.username', 'ASC')
      .limit(limit)
      .getMany();
  }

  public async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  public async consumeQuota(
    userId: number,
    sizeBytes: number,
    quotaBytes: number,
  ): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ storageUsedBytes: () => 'storage_used_bytes + :sizeIncr' })
      .where('id = :userId', { userId })
      .andWhere('storage_used_bytes + :sizeCheck <= :quota', {
        sizeCheck: sizeBytes,
        quota: quotaBytes,
      })
      .setParameter('sizeIncr', sizeBytes)
      .execute();

    return (result.affected ?? 0) > 0;
  }

  public async releaseQuota(
    userId: number,
    sizeBytes: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(UserEntity) : this.repo;

    await repo
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        storageUsedBytes: () =>
          'GREATEST(0::bigint, storage_used_bytes - :sizeDecr)',
      })
      .where('id = :userId', { userId })
      .setParameter('sizeDecr', sizeBytes)
      .execute();
  }

  public async setAvatarFileId(
    userId: number,
    fileId: number | null,
  ): Promise<void> {
    await this.repo.update(userId, { avatarFileId: fileId });
  }

  public async markOffline(userId: number, at: Date): Promise<void> {
    await this.repo.update(userId, { lastSeenAt: at });
  }

  public async updateProfile(
    userId: number,
    patch: Partial<
      Pick<UserEntity, 'nickname' | 'bio' | 'pushEnabled' | 'theme'>
    >,
  ): Promise<void> {
    await this.repo.update(userId, patch);
  }
}
