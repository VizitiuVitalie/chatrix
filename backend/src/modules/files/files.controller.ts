import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  SerializeOptions,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ChatDto } from '../chats/dto/chat.dto';
import { UserDto } from '../users/dto/user.dto';
import { FileDto } from './dto/file.dto';
import { FilesPageDto } from './dto/files-page.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { FileKind } from './enums/file-kind.enum';
import { FilesService } from './files.service';
import {
  isAudioMime,
  isImageMime,
  isVideoMime,
} from './constants/files.constants';
import { ServeFileResult } from './types/serve-file-result.type';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FilesController.name);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Upload a single file (multipart). Returns FileDto. The file stays orphan until claimed by POST /messages with its id in `fileIds`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: FileDto })
  @ApiBadRequestResponse({
    description: 'Missing file or unsupported MIME type',
  })
  @ApiPayloadTooLargeResponse({
    description:
      'Per-file size limit (MAX_UPLOAD_SIZE_MB) or per-user storage quota exceeded',
  })
  public async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<FileDto> {
    if (!file) {
      throw new BadRequestException('Missing `file` field in multipart body');
    }

    this.logger.info(
      'upload',
      {
        userId: user.id,
        originalName: file.originalname,
        clientMime: file.mimetype,
        size: file.size,
      },
      'Upload file request',
    );

    return this.filesService.upload(user.id, FileKind.MESSAGE_ATTACHMENT, file);
  }

  @Put('avatar/me')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      "Replace the calling user's avatar. Reuses the upload pipeline (magic-bytes, sharp WebP transcode, quota).",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({
    description: 'Missing file or unsupported MIME type',
  })
  @ApiPayloadTooLargeResponse({
    description: 'Per-file size cap or per-user storage quota exceeded',
  })
  public async setMyAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserDto> {
    if (!file) {
      throw new BadRequestException('Missing `file` field in multipart body');
    }

    this.logger.info(
      'setMyAvatar',
      {
        userId: user.id,
        originalName: file.originalname,
        clientMime: file.mimetype,
        size: file.size,
      },
      'Replace avatar request',
    );

    return this.filesService.replaceUserAvatar(user.id, file);
  }

  @Delete('avatar/me')
  @ApiOperation({
    summary:
      "Clear the calling user's avatar. Idempotent — returns the profile unchanged if no avatar was set.",
  })
  @ApiOkResponse({ type: UserDto })
  public async clearMyAvatar(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserDto> {
    this.logger.info(
      'clearMyAvatar',
      { userId: user.id },
      'Clear avatar request',
    );

    return this.filesService.clearUserAvatar(user.id);
  }

  @Put('avatar/chat/:chatId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      "Replace a group chat's avatar (owner only). Direct chats are rejected with 400.",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: ChatDto })
  @ApiBadRequestResponse({
    description: 'Missing file, unsupported MIME, or direct chat',
  })
  @ApiForbiddenResponse({ description: 'Not the chat owner' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiPayloadTooLargeResponse({
    description: 'Per-file size cap or per-user storage quota exceeded',
  })
  public async setChatAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', ParseIntPipe) chatId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ChatDto> {
    if (!file) {
      throw new BadRequestException('Missing `file` field in multipart body');
    }

    this.logger.info(
      'setChatAvatar',
      {
        actorId: user.id,
        chatId,
        originalName: file.originalname,
        clientMime: file.mimetype,
        size: file.size,
      },
      'Replace chat avatar request',
    );

    return this.filesService.replaceChatAvatar(user.id, chatId, file);
  }

  @Delete('avatar/chat/:chatId')
  @ApiOperation({
    summary:
      "Clear a group chat's avatar (owner only). Idempotent — returns the chat unchanged if no avatar was set.",
  })
  @ApiOkResponse({ type: ChatDto })
  @ApiBadRequestResponse({ description: 'Direct chat' })
  @ApiForbiddenResponse({ description: 'Not the chat owner' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async clearChatAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', ParseIntPipe) chatId: number,
  ): Promise<ChatDto> {
    this.logger.info(
      'clearChatAvatar',
      { actorId: user.id, chatId },
      'Clear chat avatar request',
    );

    return this.filesService.clearChatAvatar(user.id, chatId);
  }

  @Get('mine')
  @ApiOperation({
    summary:
      "List the caller's message attachments, paginated and sortable (default: heaviest first). Avatars are excluded.",
  })
  @ApiOkResponse({ type: FilesPageDto })
  public async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListFilesQueryDto,
  ): Promise<FilesPageDto> {
    this.logger.debug(
      'listMine',
      {
        userId: user.id,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
      },
      'List my files request',
    );

    return this.filesService.listMine(user.id, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Hard-delete one of the caller's message attachments. Frees quota; S3 objects are removed best-effort. Avatars are rejected (use their dedicated endpoints).",
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiForbiddenResponse({
    description: 'Not the uploader, or the file is an avatar',
  })
  @ApiNotFoundResponse({ description: 'File not found' })
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) fileId: number,
  ): Promise<void> {
    this.logger.info(
      'remove',
      { userId: user.id, fileId },
      'Delete file request',
    );

    await this.filesService.delete(user.id, fileId);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Download a file. Streams private attachments through the API (after membership check); redirects to the public URL for avatars.',
  })
  @ApiOkResponse({ description: 'File stream' })
  @ApiResponse({ status: 302, description: 'Redirect to public avatar URL' })
  @ApiForbiddenResponse({ description: "Not a member of the file's chat" })
  @ApiNotFoundResponse({ description: 'File not found' })
  public async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) fileId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const result = await this.filesService.serveOriginal(user.id, fileId);

    return this.respond(result, res);
  }

  @Get(':id/thumbnail')
  @ApiOperation({
    summary:
      'Download the WebP thumbnail of an image file. Returns 404 for non-image attachments.',
  })
  @ApiOkResponse({ description: 'Thumbnail stream' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to public avatar thumbnail URL',
  })
  @ApiForbiddenResponse({ description: "Not a member of the file's chat" })
  @ApiNotFoundResponse({
    description: 'No thumbnail (non-image or file missing)',
  })
  public async thumbnail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) fileId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | undefined> {
    const result = await this.filesService.serveThumbnail(user.id, fileId);

    return this.respond(result, res);
  }

  private respond(
    result: ServeFileResult,
    res: Response,
  ): StreamableFile | undefined {
    if (result.mode === 'redirect') {
      res.redirect(302, result.url);

      return undefined;
    }

    const inline =
      isImageMime(result.mimeType) ||
      isAudioMime(result.mimeType) ||
      isVideoMime(result.mimeType);

    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: inline
        ? 'inline'
        : this.attachmentDisposition(result.downloadName),
    });
  }

  private attachmentDisposition(downloadName: string): string {
    const asciiFallback =
      downloadName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') ||
      'download';
    const encoded = encodeURIComponent(downloadName);

    return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
  }
}
