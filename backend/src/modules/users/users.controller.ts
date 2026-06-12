import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import {
  USER_SEARCH_THROTTLE_LIMIT,
  USER_SEARCH_THROTTLE_TTL_MS,
} from './constants/users.constants';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { OwnUserDto } from './dto/own-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UserStorageDto } from './dto/user-storage.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UsersController.name);
  }

  @Get('search')
  @UseGuards(UserThrottlerGuard)
  @Throttle({
    default: {
      limit: USER_SEARCH_THROTTLE_LIMIT,
      ttl: USER_SEARCH_THROTTLE_TTL_MS,
    },
  })
  @ApiOperation({
    summary:
      'Substring search over `username` and `nickname`, case-insensitive. The current user is always excluded from results. Used by the new-chat dialog autocomplete.',
  })
  @ApiOkResponse({ type: UserDto, isArray: true })
  @ApiBadRequestResponse({
    description:
      'Query string failed validation (missing / blank `q`, `limit` out of range)',
  })
  @ApiTooManyRequestsResponse({
    description: 'Per-user search rate limit exceeded',
  })
  public async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchUsersQueryDto,
  ): Promise<UserDto[]> {
    this.logger.debug(
      'search',
      { userId: user.id, q: query.q, limit: query.limit ?? null },
      'User search request',
    );

    return this.usersService.searchUsers(user.id, query);
  }

  @Get('me/storage')
  @ApiOperation({
    summary:
      'Storage quota summary for the current user (used / quota / percent).',
  })
  @ApiOkResponse({ type: UserStorageDto })
  public async myStorage(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserStorageDto> {
    this.logger.debug(
      'myStorage',
      { userId: user.id },
      'User storage info request',
    );

    return this.usersService.getStorageInfo(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary:
      "Update the calling user's editable profile fields (`nickname`, `bio`). `username` is immutable; `email` is not editable until the verification flow lands.",
  })
  @ApiOkResponse({ type: OwnUserDto })
  @ApiBadRequestResponse({
    description: 'Validation failed (length / regex on nickname or bio).',
  })
  public async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<OwnUserDto> {
    this.logger.info(
      'updateMe',
      { userId: user.id, fields: Object.keys(dto) },
      'Update profile request',
    );

    return this.usersService.updateProfile(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Public profile of any user (avatar, nickname, username, bio, isOnline). Sensitive fields (storage, password) are never in UserDto.',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  public async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserDto> {
    this.logger.debug(
      'getById',
      { actorId: user.id, targetId: id },
      'Get user by id request',
    );

    return this.usersService.getProfile(id);
  }
}
