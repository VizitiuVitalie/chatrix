import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import sharp from 'sharp';
import { DataSource, EntityManager } from 'typeorm';
import { AppLogger } from '../../common/logger/app-logger.service';
import {
  DomainEvent,
  type ChatUpdatedEvent,
  type UserUpdatedEvent,
} from '../../events/domain-events';
import { StorageService } from '../../core/storage/storage.service';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { ChatMemberRole } from '../chat-members/enums/chat-member-role.enum';
import { ChatsService } from '../chats/chats.service';
import { ChatDto } from '../chats/dto/chat.dto';
import { ChatType } from '../chats/enums/chat-type.enum';
import { UserDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { FileDto } from './dto/file.dto';
import { FilesPageDto } from './dto/files-page.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { FileEntity } from './entities/file.entity';
import { FileKind } from './enums/file-kind.enum';
import { FileSort } from './enums/file-sort.enum';
import {
  ALLOWED_MIME,
  AVATAR_CACHE_CONTROL,
  isImageMime,
  needsImageTranscode,
  ORPHAN_FILE_TTL_MS,
  THUMBNAIL_MAX_SIZE_PX,
} from './constants/files.constants';
import { FilesRepository } from './files.repository';
import { ServeFileResult } from './types/serve-file-result.type';

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storage: StorageService,
    private readonly usersService: UsersService,
    private readonly chatMembersService: ChatMembersService,
    private readonly chatsService: ChatsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FilesService.name);
  }

  public async serveOriginal(
    userId: number,
    fileId: number,
  ): Promise<ServeFileResult> {
    const file = await this.filesRepository.findByIdWithMessage(fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.kind !== FileKind.MESSAGE_ATTACHMENT) {
      return {
        mode: 'redirect',
        url: this.storage.getPublicUrl(file.storageKey),
      };
    }

    await this.assertCanReadAttachment(file, userId);

    return {
      mode: 'stream',
      stream: await this.storage.getStream(file.storageKey),
      mimeType: file.mimeType,
      downloadName: file.originalName,
    };
  }

  public async serveThumbnail(
    userId: number,
    fileId: number,
  ): Promise<ServeFileResult> {
    const file = await this.filesRepository.findByIdWithMessage(fileId);

    if (!file || !file.thumbnailStorageKey) {
      throw new NotFoundException('Thumbnail not available');
    }

    if (file.kind !== FileKind.MESSAGE_ATTACHMENT) {
      return {
        mode: 'redirect',
        url: this.storage.getPublicUrl(file.thumbnailStorageKey),
      };
    }

    await this.assertCanReadAttachment(file, userId);
    return {
      mode: 'stream',
      stream: await this.storage.getStream(file.thumbnailStorageKey),
      mimeType: 'image/webp',
      downloadName: `${fileId}-thumb.webp`,
    };
  }

  public async listMine(
    userId: number,
    query: ListFilesQueryDto,
  ): Promise<FilesPageDto> {
    const sort = query.sort ?? FileSort.SIZE_DESC;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.filesRepository.findPageForUser(
      userId,
      sort,
      page,
      limit,
    );

    return new FilesPageDto({
      items: items.map((f) => this.toDto(f)),
      total,
      page,
      limit,
    });
  }

  public async delete(userId: number, fileId: number): Promise<void> {
    const file = await this.filesRepository.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.kind !== FileKind.MESSAGE_ATTACHMENT) {
      throw new ForbiddenException(
        file.kind === FileKind.USER_AVATAR
          ? 'User avatars are managed via /api/files/avatar/me'
          : 'Chat avatars are managed via /api/files/avatar/chat/:chatId',
      );
    }

    if (file.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(FileEntity, fileId);
      await this.usersService.releaseQuota(userId, file.sizeBytes, manager);
    });

    await this.storage.delete(file.storageKey).catch(() => undefined);
    if (file.thumbnailStorageKey) {
      await this.storage
        .delete(file.thumbnailStorageKey)
        .catch(() => undefined);
    }

    this.logger.info(
      'delete',
      {
        userId,
        fileId,
        sizeBytes: file.sizeBytes,
        kind: file.kind,
      },
      'File deleted',
    );
  }

  public async deleteByMessageId(messageId: number): Promise<void> {
    const files = await this.filesRepository.findByMessageId(messageId);
    if (files.length === 0) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      for (const file of files) {
        await this.usersService.releaseQuota(
          file.uploadedById,
          file.sizeBytes,
          manager,
        );

        await manager.delete(FileEntity, file.id);
      }
    });

    for (const file of files) {
      await this.storage.delete(file.storageKey).catch(() => undefined);

      if (file.thumbnailStorageKey) {
        await this.storage
          .delete(file.thumbnailStorageKey)
          .catch(() => undefined);
      }
    }

    this.logger.info(
      'deleteByMessageId',
      {
        messageId,
        fileCount: files.length,
        totalBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      },
      'Message attachments released',
    );
  }

  public async replaceUserAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UserDto> {
    const oldFileId = await this.usersService.getAvatarFileId(userId);

    const newFile = await this.upload(userId, FileKind.USER_AVATAR, file);

    await this.usersService.setAvatarFileId(userId, newFile.id);

    if (oldFileId !== null) {
      await this.removeAvatarFile(oldFileId);
    }

    this.logger.info(
      'replaceUserAvatar',
      { userId, newFileId: newFile.id, replacedFileId: oldFileId },
      'User avatar replaced',
    );

    const refreshed = await this.usersService.getProfile(userId);

    this.eventEmitter.emit(DomainEvent.USER_UPDATED, {
      user: refreshed,
    } satisfies UserUpdatedEvent);

    return refreshed;
  }

  public async clearUserAvatar(userId: number): Promise<UserDto> {
    const oldFileId = await this.usersService.getAvatarFileId(userId);

    if (oldFileId === null) {
      return this.usersService.getProfile(userId);
    }

    await this.usersService.setAvatarFileId(userId, null);

    await this.removeAvatarFile(oldFileId);

    this.logger.info(
      'clearUserAvatar',
      { userId, clearedFileId: oldFileId },
      'User avatar cleared',
    );

    const refreshed = await this.usersService.getProfile(userId);

    this.eventEmitter.emit(DomainEvent.USER_UPDATED, {
      user: refreshed,
    } satisfies UserUpdatedEvent);

    return refreshed;
  }

  private async assertCanManageGroupAvatar(
    actorId: number,
    chatId: number,
  ): Promise<void> {
    const { chat, me } = await this.chatsService.findChatAndActorMember(
      chatId,
      actorId,
    );

    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException("Direct chats don't have a group avatar");
    }

    if (me.role !== ChatMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the group owner can change the chat avatar',
      );
    }
  }

  public async replaceChatAvatar(
    actorId: number,
    chatId: number,
    file: Express.Multer.File,
  ): Promise<ChatDto> {
    await this.assertCanManageGroupAvatar(actorId, chatId);

    const oldFileId = await this.chatsService.getAvatarFileId(chatId);

    const newFile = await this.upload(actorId, FileKind.CHAT_AVATAR, file);

    await this.chatsService.setAvatarFileId(chatId, newFile.id);

    if (oldFileId !== null) {
      await this.removeAvatarFile(oldFileId);
    }
    this.logger.info(
      'replaceChatAvatar',
      { actorId, chatId, newFileId: newFile.id, replacedFileId: oldFileId },
      'Chat avatar replaced',
    );

    const refreshed = await this.chatsService.findOneForUser(actorId, chatId);

    this.eventEmitter.emit(DomainEvent.CHAT_UPDATED, {
      chat: refreshed,
    } satisfies ChatUpdatedEvent);

    return refreshed;
  }

  public async clearChatAvatar(
    actorId: number,
    chatId: number,
  ): Promise<ChatDto> {
    await this.assertCanManageGroupAvatar(actorId, chatId);

    const oldFileId = await this.chatsService.getAvatarFileId(chatId);
    if (oldFileId === null) {
      return this.chatsService.findOneForUser(actorId, chatId);
    }

    await this.chatsService.setAvatarFileId(chatId, null);

    await this.removeAvatarFile(oldFileId);

    this.logger.info(
      'clearChatAvatar',
      { actorId, chatId, clearedFileId: oldFileId },
      'Chat avatar cleared',
    );

    const refreshed = await this.chatsService.findOneForUser(actorId, chatId);

    this.eventEmitter.emit(DomainEvent.CHAT_UPDATED, {
      chat: refreshed,
    } satisfies ChatUpdatedEvent);

    return refreshed;
  }

  public async sweepOrphanAttachments(): Promise<void> {
    const olderThan = new Date(Date.now() - ORPHAN_FILE_TTL_MS);

    const orphans = await this.dataSource.transaction(async (manager) => {
      const swept = await this.filesRepository.sweepOrphanAttachments(
        olderThan,
        manager,
      );
      for (const orphan of swept) {
        await this.usersService.releaseQuota(
          orphan.uploadedById,
          orphan.sizeBytes,
          manager,
        );
      }

      return swept;
    });

    if (orphans.length === 0) {
      return;
    }

    for (const orphan of orphans) {
      await this.storage.delete(orphan.storageKey).catch(() => undefined);
      if (orphan.thumbnailStorageKey) {
        await this.storage
          .delete(orphan.thumbnailStorageKey)
          .catch(() => undefined);
      }
    }

    const totalBytes = orphans.reduce((sum, o) => sum + o.sizeBytes, 0);

    this.logger.info(
      'sweepOrphanAttachments',
      { count: orphans.length, totalBytes },
      'Orphan attachments swept',
    );
  }

  public async sweepOrphanAvatars(): Promise<void> {
    const olderThan = new Date(Date.now() - ORPHAN_FILE_TTL_MS);

    const orphans = await this.dataSource.transaction(async (manager) => {
      return this.filesRepository.sweepOrphanAvatars(olderThan, manager);
    });

    if (orphans.length === 0) {
      return;
    }

    for (const orphan of orphans) {
      await this.storage.delete(orphan.storageKey).catch(() => undefined);

      if (orphan.thumbnailStorageKey) {
        await this.storage
          .delete(orphan.thumbnailStorageKey)
          .catch(() => undefined);
      }
    }

    this.logger.info(
      'sweepOrphanAvatars',
      { count: orphans.length },
      'Orphan avatars swept',
    );
  }

  public async claimFilesForMessage(
    uploaderId: number,
    fileIds: number[],
    messageId: number,
    manager: EntityManager,
  ): Promise<void> {
    const affected = await this.filesRepository.claimFilesForMessage(
      uploaderId,
      fileIds,
      messageId,
      manager,
    );

    if (affected !== fileIds.length) {
      throw new BadRequestException(
        'One or more attached files are unknown, already claimed by another message, or do not belong to you',
      );
    }

    this.logger.info(
      'claimFilesForMessage',
      { uploaderId, messageId, fileIds },
      'Files claimed by message',
    );
  }

  private async removeAvatarFile(fileId: number): Promise<void> {
    const file = await this.filesRepository.findById(fileId);

    if (!file) {
      return;
    }

    await this.filesRepository.hardDelete(fileId);

    await this.storage.delete(file.storageKey).catch(() => undefined);

    if (file.thumbnailStorageKey) {
      await this.storage
        .delete(file.thumbnailStorageKey)
        .catch(() => undefined);
    }
  }

  private async assertCanReadAttachment(
    file: FileEntity,
    userId: number,
  ): Promise<void> {
    if (file.messageId === null) {
      if (file.uploadedById !== userId) {
        throw new ForbiddenException(
          "You cannot access another user's unclaimed upload",
        );
      }

      return;
    }

    if (!file.message) {
      throw new NotFoundException("File's message is no longer available");
    }

    const membership = await this.chatMembersService.findMembership(
      userId,
      file.message.chatId,
    );

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of the chat this file belongs to',
      );
    }
  }
  public async upload(
    userId: number,
    kind: FileKind,
    file: Express.Multer.File,
  ): Promise<FileDto> {
    const decodedOriginalName = Buffer.from(
      file.originalname,
      'latin1',
    ).toString('utf8');

    const detected = await fileTypeFromBuffer(file.buffer);

    const sourceMime = detected?.mime ?? file.mimetype;

    const isAvatar =
      kind === FileKind.USER_AVATAR || kind === FileKind.CHAT_AVATAR;

    const passesMimeCheck = isAvatar
      ? isImageMime(sourceMime)
      : ALLOWED_MIME.has(sourceMime);

    if (!passesMimeCheck) {
      throw new BadRequestException(
        isAvatar
          ? `Avatar must be an image — got "${sourceMime}"`
          : `Unsupported file type: ${sourceMime}`,
      );
    }

    const isTextMime = sourceMime === 'text/plain' || sourceMime === 'text/csv';

    if (!detected && !isTextMime) {
      throw new BadRequestException(
        `File content does not match the claimed type "${sourceMime}"`,
      );
    }

    const sourceExt = (
      detected?.ext ?? extname(decodedOriginalName).slice(1)
    ).toLowerCase();

    let storedBuffer = file.buffer;
    let storedMime = sourceMime;
    let storedExt = sourceExt;
    let thumbnailBuffer: Buffer | null = null;
    let thumbnailStorageKey: string | null = null;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;
    const objectId = randomUUID();
    const prefix =
      kind === FileKind.MESSAGE_ATTACHMENT ? 'attachments' : 'avatars';

    if (isImageMime(sourceMime)) {
      if (needsImageTranscode(sourceMime)) {
        storedBuffer = await sharp(file.buffer)
          .rotate()
          .webp({ quality: 90 })
          .toBuffer();
        storedMime = 'image/webp';
        storedExt = 'webp';
      }

      const shouldGenerateThumbnail = !isAvatar && sourceMime !== 'image/gif';
      if (shouldGenerateThumbnail) {
        const { data, info } = await sharp(file.buffer)
          .rotate()
          .resize(THUMBNAIL_MAX_SIZE_PX, THUMBNAIL_MAX_SIZE_PX, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer({ resolveWithObject: true });

        thumbnailBuffer = data;
        thumbnailStorageKey = `${prefix}/${objectId}-thumb.webp`;
        imageWidth = info.width;
        imageHeight = info.height;
      } else if (!isAvatar && sourceMime === 'image/gif') {
        const meta = await sharp(file.buffer).metadata();

        imageWidth = meta.width ?? null;
        imageHeight = meta.height ?? null;
      }
    }

    const storageKey = storedExt
      ? `${prefix}/${objectId}.${storedExt}`
      : `${prefix}/${objectId}`;

    const storedSize = storedBuffer.byteLength;

    let quotaConsumed = false;
    if (kind === FileKind.MESSAGE_ATTACHMENT) {
      const consumed = await this.usersService.consumeQuota(userId, storedSize);
      if (!consumed) {
        throw new PayloadTooLargeException(
          'Storage quota exceeded — delete files to free space',
        );
      }

      quotaConsumed = true;
    }

    try {
      await this.storage.put(storageKey, storedBuffer, {
        contentType: storedMime,
        cacheControl:
          kind === FileKind.MESSAGE_ATTACHMENT
            ? undefined
            : AVATAR_CACHE_CONTROL,
      });

      if (thumbnailBuffer && thumbnailStorageKey) {
        await this.storage.put(thumbnailStorageKey, thumbnailBuffer, {
          contentType: 'image/webp',
          cacheControl:
            kind === FileKind.MESSAGE_ATTACHMENT
              ? undefined
              : AVATAR_CACHE_CONTROL,
        });
      }

      const fileRow = await this.filesRepository.create({
        kind,
        storageKey,
        thumbnailStorageKey,
        originalName: decodedOriginalName.slice(0, 255),
        mimeType: storedMime,
        sizeBytes: storedSize,
        width: imageWidth,
        height: imageHeight,
        uploadedById: userId,
        messageId: null,
      });

      this.logger.info(
        'upload',
        {
          userId,
          kind,
          fileId: fileRow.id,
          mimeType: storedMime,
          sizeBytes: storedSize,
          transcoded: needsImageTranscode(sourceMime),
          hasThumbnail: thumbnailStorageKey !== null,
        },
        'File uploaded',
      );

      return this.toDto(fileRow);
    } catch (err) {
      await this.storage.delete(storageKey).catch(() => undefined);

      if (thumbnailStorageKey) {
        await this.storage.delete(thumbnailStorageKey).catch(() => undefined);
      }

      if (quotaConsumed) {
        await this.usersService
          .releaseQuota(userId, storedSize)
          .catch(() => undefined);
      }

      throw err;
    }
  }

  public toDto(file: FileEntity): FileDto {
    const dto = new FileDto();
    dto.id = file.id;
    dto.kind = file.kind;
    dto.originalName = file.originalName;
    dto.mimeType = file.mimeType;
    dto.sizeBytes = file.sizeBytes;
    dto.width = file.width;
    dto.height = file.height;
    dto.createdAt = file.createdAt;
    dto.updatedAt = file.updatedAt;
    dto.deletedAt = file.deletedAt;

    if (file.kind === FileKind.MESSAGE_ATTACHMENT) {
      dto.downloadUrl = `/api/files/${file.id}`;
      dto.thumbnailUrl = file.thumbnailStorageKey
        ? `/api/files/${file.id}/thumbnail`
        : null;
    } else {
      dto.downloadUrl = this.storage.getPublicUrl(file.storageKey);
      dto.thumbnailUrl = file.thumbnailStorageKey
        ? this.storage.getPublicUrl(file.thumbnailStorageKey)
        : null;
    }
    return dto;
  }
}
