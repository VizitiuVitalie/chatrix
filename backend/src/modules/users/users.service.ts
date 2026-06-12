import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { EntityManager } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import { StorageService } from '../../core/storage/storage.service';
import { ClientEvent, type ActivityPayload } from '../../events/client-events';
import { DomainEvent, type UserUpdatedEvent } from '../../events/domain-events';
import { SocketRoomRegistry } from '../../sockets/services/socket-room-registry.service';
import { WsEmitter } from '../../sockets/services/ws-emitter.service';
import { DEFAULT_SEARCH_LIMIT } from './constants/users.constants';
import { ActivityClientDto } from './dto/activity-client.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OwnUserDto } from './dto/own-user.dto';
import { UserDto } from './dto/user.dto';
import { UserStorageDto } from './dto/user-storage.dto';
import { UserEntity } from './entities/user.entity';
import { ActivityState } from './enums/activity-state.enum';
import { ActivityType } from './enums/activity-type.enum';
import { escapeLikePattern } from './helpers/escape-like-pattern.helper';
import { normalizeNickname } from './helpers/normalize-nickname.helper';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly socketActivities = new Map<string, Set<string>>();

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly roomRegistry: SocketRoomRegistry,
    private readonly wsEmitter: WsEmitter,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  public recordUserActivity(
    socketId: string,
    userId: number,
    body: ActivityClientDto,
  ): void {
    const key = `${body.chatId}:${body.type}`;

    if (body.state === ActivityState.START) {
      let set = this.socketActivities.get(socketId);

      if (!set) {
        set = new Set();
        this.socketActivities.set(socketId, set);
      }

      set.add(key);
    } else {
      const set = this.socketActivities.get(socketId);

      if (set) {
        set.delete(key);

        if (set.size === 0) this.socketActivities.delete(socketId);
      }
    }

    const payload: ActivityPayload = {
      userId,
      chatId: body.chatId,
      type: body.type,
      state: body.state,
    };

    this.wsEmitter.toChatRoom(body.chatId, ClientEvent.USER_ACTIVITY, payload);
  }

  public drainActivitiesOnDisconnect(socketId: string, userId: number): void {
    const set = this.socketActivities.get(socketId);

    if (!set) return;

    for (const key of set) {
      const [chatIdStr, type] = key.split(':');

      const chatId = Number(chatIdStr);

      const payload: ActivityPayload = {
        userId,
        chatId,
        type: type as ActivityType,
        state: ActivityState.STOP,
      };

      this.wsEmitter.toChatRoom(chatId, ClientEvent.USER_ACTIVITY, payload);
    }

    this.socketActivities.delete(socketId);
  }

  public getQuotaBytes(): number {
    return this.config.get<number>('DEFAULT_USER_QUOTA_MB')! * 1024 * 1024;
  }

  public async consumeQuota(
    userId: number,
    sizeBytes: number,
  ): Promise<boolean> {
    const ok = await this.usersRepository.consumeQuota(
      userId,
      sizeBytes,
      this.getQuotaBytes(),
    );

    if (!ok) {
      this.logger.warn(
        'consumeQuota',
        { userId, sizeBytes, quotaBytes: this.getQuotaBytes() },
        'Quota check rejected upload',
      );
    }

    return ok;
  }

  public async releaseQuota(
    userId: number,
    sizeBytes: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this.usersRepository.releaseQuota(userId, sizeBytes, manager);
  }

  public async getStorageInfo(userId: number): Promise<UserStorageDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const quotaBytes = this.getQuotaBytes();
    const usedBytes = user.storageUsedBytes;
    const percentUsed =
      quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 100) : 0;

    return plainToInstance(
      UserStorageDto,
      { usedBytes, quotaBytes, percentUsed },
      { excludeExtraneousValues: true },
    );
  }

  public async getProfile(id: number): Promise<UserDto> {
    const user = await this.usersRepository.findByIdWithAvatar(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toDto(user);
  }

  public async getOwnProfile(id: number): Promise<OwnUserDto> {
    const user = await this.usersRepository.findByIdWithAvatar(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toOwnDto(user);
  }

  public async updateProfile(
    userId: number,
    dto: UpdateUserDto,
  ): Promise<OwnUserDto> {
    const patch: Partial<
      Pick<UserEntity, 'nickname' | 'bio' | 'pushEnabled' | 'theme'>
    > = {};
    if (dto.nickname !== undefined) {
      patch.nickname = normalizeNickname(dto.nickname);
    }
    if (dto.bio !== undefined) {
      patch.bio =
        typeof dto.bio === 'string' && dto.bio.trim().length === 0
          ? null
          : dto.bio;
    }
    if (dto.pushEnabled !== undefined) patch.pushEnabled = dto.pushEnabled;
    if (dto.theme !== undefined) patch.theme = dto.theme;

    if (Object.keys(patch).length === 0) {
      return this.getOwnProfile(userId);
    }

    await this.usersRepository.updateProfile(userId, patch);

    this.logger.info(
      'updateProfile',
      { userId, fields: Object.keys(patch) },
      'User profile updated',
    );

    const entity = await this.usersRepository.findByIdWithAvatar(userId);
    if (!entity) {
      throw new NotFoundException('User not found');
    }

    this.eventEmitter.emit(DomainEvent.USER_UPDATED, {
      user: this.toDto(entity),
    } satisfies UserUpdatedEvent);

    return this.toOwnDto(entity);
  }

  public async getAvatarFileId(userId: number): Promise<number | null> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.avatarFileId;
  }

  public async setAvatarFileId(
    userId: number,
    fileId: number | null,
  ): Promise<void> {
    await this.usersRepository.setAvatarFileId(userId, fileId);
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    return this.usersRepository.findByUsername(username);
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  public async findById(id: number): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  public async findManyByIds(ids: number[]): Promise<UserEntity[]> {
    return this.usersRepository.findManyByIds(ids);
  }

  public async searchUsers(
    currentUserId: number,
    dto: SearchUsersQueryDto,
  ): Promise<UserDto[]> {
    const trimmed = dto.q.trim();
    const limit = dto.limit ?? DEFAULT_SEARCH_LIMIT;
    const pattern = `%${escapeLikePattern(trimmed)}%`;

    this.logger.debug(
      'searchUsers',
      { currentUserId, q: trimmed, limit },
      'User search request',
    );

    const users = await this.usersRepository.searchByQuery(
      pattern,
      limit,
      currentUserId,
    );

    this.logger.info(
      'searchUsers',
      { currentUserId, q: trimmed, limit, resultCount: users.length },
      'User search complete',
    );

    return users.map((user) => this.toDto(user));
  }

  public async markOffline(userId: number, at: Date): Promise<void> {
    await this.usersRepository.markOffline(userId, at);
  }

  public async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.usersRepository.create(data);

    this.logger.info(
      'create',
      { userId: user.id, username: user.username },
      'User created',
    );

    return user;
  }

  public toDto(user: UserEntity): UserDto {
    const dto = plainToInstance(UserDto, user, {
      excludeExtraneousValues: true,
    });

    this.hydrateNestedUser(dto, user);

    return dto;
  }

  public toOwnDto(user: UserEntity): OwnUserDto {
    const dto = plainToInstance(OwnUserDto, user, {
      excludeExtraneousValues: true,
    });

    this.hydrateNestedUser(dto, user);

    return dto;
  }

  public hydrateNestedUser(
    dto: {
      isOnline: boolean;
      avatarUrl: string | null;
      thumbnailUrl: string | null;
    },
    entity: UserEntity,
  ): void {
    dto.isOnline = this.roomRegistry.isUserOnline(entity.id);

    const avatarFile = entity.avatarFile ?? null;

    dto.avatarUrl = avatarFile
      ? this.storage.getPublicUrl(avatarFile.storageKey)
      : null;

    dto.thumbnailUrl = avatarFile?.thumbnailStorageKey
      ? this.storage.getPublicUrl(avatarFile.thumbnailStorageKey)
      : null;
  }
}
