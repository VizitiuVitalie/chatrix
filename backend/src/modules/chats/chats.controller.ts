import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { ChatMemberDto } from '../chat-members/dto/chat-member.dto';
import { ChatsService } from './chats.service';
import { ChatDto } from './dto/chat.dto';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { DeleteChatQueryDto } from './dto/delete-chat-query.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { DeleteChatScope } from './enums/delete-chat-scope.enum';

@ApiTags('chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly chatMembersService: ChatMembersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatsController.name);
  }

  @Post('direct')
  @ApiOperation({
    summary:
      'Find-or-create a direct chat with another user (idempotent; second call returns the same chat).',
  })
  @ApiCreatedResponse({ type: ChatDto })
  @ApiBadRequestResponse({ description: 'Cannot target yourself' })
  @ApiNotFoundResponse({ description: 'Target user not found' })
  public async createDirect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDirectChatDto,
  ): Promise<ChatDto> {
    this.logger.info(
      'createDirect',
      { userId: user.id, targetUserId: dto.targetUserId },
      'Create direct chat request',
    );

    return this.chatsService.createDirect(user.id, dto);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new group chat.' })
  @ApiCreatedResponse({ type: ChatDto })
  @ApiBadRequestResponse({ description: 'memberIds contains the creator' })
  @ApiNotFoundResponse({ description: 'One or more members not found' })
  public async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupChatDto,
  ): Promise<ChatDto> {
    this.logger.info(
      'createGroup',
      { userId: user.id, memberCount: dto.memberIds.length },
      'Create group chat request',
    );

    return this.chatsService.createGroup(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List chats the current user belongs to.' })
  @ApiOkResponse({ type: ChatDto, isArray: true })
  public async findMyChats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatDto[]> {
    this.logger.debug(
      'findMyChats',
      { userId: user.id },
      'List my chats request',
    );

    return this.chatsService.findMyChats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat by id (with full member list).' })
  @ApiOkResponse({ type: ChatDto })
  @ApiForbiddenResponse({ description: 'Not a member of this chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChatDto> {
    this.logger.debug(
      'findOne',
      { userId: user.id, chatId: id },
      'Get chat request',
    );

    return this.chatsService.findOneForUser(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Rename a group chat. Owner only. Direct chats are rejected (400).',
  })
  @ApiOkResponse({ type: ChatDto })
  @ApiBadRequestResponse({
    description: 'Direct chats do not have editable fields / name blank',
  })
  @ApiForbiddenResponse({
    description: 'Only the group owner can edit this chat',
  })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatDto,
  ): Promise<ChatDto> {
    this.logger.info(
      'update',
      { userId: user.id, chatId: id },
      'Update chat request',
    );

    return this.chatsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a chat. `?scope=both` (default) hard-deletes for everyone (direct: any participant; group: owner only). `?scope=me` (direct chats only) stamps a per-user history-cleared marker so the chat disappears from the caller until a new message arrives.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiBadRequestResponse({
    description: 'scope=me on a group chat (not supported)',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: DeleteChatQueryDto,
  ): Promise<void> {
    const scope = query.scope ?? DeleteChatScope.BOTH;

    this.logger.info(
      'remove',
      { userId: user.id, chatId: id, scope },
      'Delete chat request',
    );

    await this.chatsService.delete(user.id, id, scope);
  }

  @Post(':id/read')
  @ApiOperation({
    summary:
      'Mark this chat as read by the current user up to NOW. Other participants receive a `chat-member:read` WS event so their UI can render read-receipts.',
  })
  @ApiCreatedResponse({ type: ChatMemberDto })
  @ApiForbiddenResponse({ description: 'Not a member of this chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) chatId: number,
  ): Promise<ChatMemberDto> {
    this.logger.info(
      'markRead',
      { userId: user.id, chatId },
      'Mark chat read request',
    );

    return this.chatMembersService.markRead(user.id, chatId);
  }
}
