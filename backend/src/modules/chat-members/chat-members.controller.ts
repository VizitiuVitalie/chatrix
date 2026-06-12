import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { ChatMembersService } from './chat-members.service';
import { AddChatMemberDto } from './dto/add-chat-member.dto';
import { ChatMemberDto } from './dto/chat-member.dto';
import { UpdateChatMemberRoleDto } from './dto/update-chat-member-role.dto';

@ApiTags('chat-members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('chat-members')
export class ChatMembersController {
  constructor(
    private readonly chatMembersService: ChatMembersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatMembersController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a member to a group chat (owner/admin only).',
  })
  @ApiCreatedResponse({ type: ChatMemberDto })
  @ApiBadRequestResponse({ description: 'Direct chats cannot add members' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Chat or user not found' })
  @ApiConflictResponse({ description: 'User is already a member' })
  public async add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddChatMemberDto,
  ): Promise<ChatMemberDto> {
    this.logger.info(
      'add',
      { actor: user.id, chatId: dto.chatId, addedUserId: dto.userId },
      'Add chat member request',
    );

    return this.chatMembersService.addMember(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a membership (owner only). Promoting to OWNER transfers ownership and demotes the current owner to ADMIN.',
  })
  @ApiOkResponse({ type: ChatMemberDto })
  @ApiForbiddenResponse({ description: 'Owner role required' })
  @ApiNotFoundResponse({ description: 'Chat member not found' })
  public async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) memberId: number,
    @Body() dto: UpdateChatMemberRoleDto,
  ): Promise<ChatMemberDto> {
    this.logger.info(
      'update',
      { actor: user.id, memberId, role: dto.role },
      'Update chat member request',
    );

    return this.chatMembersService.updateRole(user.id, memberId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove a member from a group chat. Self-leave is allowed for any role except owner (transfer ownership first).',
  })
  @ApiNoContentResponse({ description: 'Removed' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Chat member not found' })
  public async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) memberId: number,
  ): Promise<void> {
    this.logger.info(
      'remove',
      { actor: user.id, memberId },
      'Remove chat member request',
    );

    await this.chatMembersService.removeMember(user.id, memberId);
  }
}
