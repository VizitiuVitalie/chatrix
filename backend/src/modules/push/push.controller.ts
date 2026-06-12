import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto';
import { VapidPublicKeyDto } from './dto/vapid-public-key.dto';
import { PushService } from './push.service';

@ApiTags('push')
@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('push')
export class PushController {
  constructor(
    private readonly pushService: PushService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PushController.name);
  }

  @Get('vapid-public-key')
  @ApiOperation({
    summary:
      'Returns the VAPID public key. The frontend passes it to `pushManager.subscribe({applicationServerKey})`.',
  })
  @ApiOkResponse({ type: VapidPublicKeyDto })
  public getVapidPublicKey(): VapidPublicKeyDto {
    return this.pushService.getVapidPublicKey();
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Register (or refresh) a push subscription for the caller's current session. Idempotent: UPSERT by endpoint.",
  })
  @ApiBody({ type: SubscribePushDto })
  @ApiCreatedResponse({ type: PushSubscriptionDto })
  public async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<PushSubscriptionDto> {
    this.logger.info(
      'subscribe',
      { userId: user.id, sessionId: user.sessionId },
      'Subscribe push request',
    );

    return this.pushService.subscribe(
      user.id,
      user.sessionId,
      dto,
      userAgent ?? null,
    );
  }

  @Delete('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Unsubscribe the caller's device by endpoint. Idempotent: unknown / not-owned endpoints still return 204.",
  })
  @ApiBody({ type: UnsubscribePushDto })
  @ApiNoContentResponse({ description: 'Unsubscribed (or nothing to do)' })
  public async unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnsubscribePushDto,
  ): Promise<void> {
    this.logger.info(
      'unsubscribe',
      { userId: user.id },
      'Unsubscribe push request',
    );

    await this.pushService.unsubscribe(user.id, dto.endpoint);
  }

  @Get('subscriptions/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "List the caller's active push subscriptions. Used by the settings UI to show 'devices receiving notifications'.",
  })
  @ApiOkResponse({
    type: PushSubscriptionDto,
    isArray: true,
  })
  public async listMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PushSubscriptionDto[]> {
    return this.pushService.listMine(user.id);
  }
}
