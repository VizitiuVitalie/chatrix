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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { MessageDto } from './dto/message.dto';
import { MessagesPageDto } from './dto/messages-page.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import {
  SEND_MESSAGE_THROTTLE_LIMIT,
  SEND_MESSAGE_THROTTLE_TTL_MS,
} from './constants/messages.constants';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessagesController.name);
  }

  @Post()
  @UseGuards(UserThrottlerGuard)
  @Throttle({
    default: {
      limit: SEND_MESSAGE_THROTTLE_LIMIT,
      ttl: SEND_MESSAGE_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({ summary: 'Send a message in a chat.' })
  @ApiCreatedResponse({ type: MessageDto })
  @ApiForbiddenResponse({ description: 'Not a member of this chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiTooManyRequestsResponse({
    description: 'Per-user send rate limit exceeded',
  })
  public async send(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageDto> {
    this.logger.info(
      'send',
      { userId: user.id, chatId: dto.chatId },
      'Send message request',
    );

    return this.messagesService.send(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List messages in a chat (cursor-paginated, newest → oldest). Pass nextCursor as ?before= to fetch older messages.',
  })
  @ApiOkResponse({ type: MessagesPageDto })
  @ApiForbiddenResponse({ description: 'Not a member of this chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessagesPageDto> {
    this.logger.debug(
      'list',
      {
        userId: user.id,
        chatId: query.chatId,
        before: query.before,
        limit: query.limit,
      },
      'List messages request',
    );

    return this.messagesService.list(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Edit own message. Allowed only for the sender and only within 10 minutes of sending.',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiForbiddenResponse({
    description: 'Not the sender, or the 10-minute edit window has expired',
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  public async edit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) messageId: number,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageDto> {
    this.logger.info(
      'edit',
      { userId: user.id, messageId },
      'Edit message request',
    );

    return this.messagesService.edit(user.id, messageId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a message (hard delete). Sender: within 1 hour. Group admin/owner: any time. Direct chat: sender only.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiForbiddenResponse({
    description:
      'Not the sender (or admin/owner in group), or the sender 1-hour delete window has expired',
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) messageId: number,
  ): Promise<void> {
    this.logger.info(
      'remove',
      { userId: user.id, messageId },
      'Delete message request',
    );

    await this.messagesService.delete(user.id, messageId);
  }
}
