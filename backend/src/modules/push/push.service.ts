import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as webPush from 'web-push';
import { WebPushError } from 'web-push';
import { AppLogger } from '../../common/logger/app-logger.service';
import { type MessageCreatedEvent } from '../../events/domain-events';
import { ChatMembersService } from '../chat-members/chat-members.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { VapidPublicKeyDto } from './dto/vapid-public-key.dto';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';
import { WebPushPayload } from './interfaces/web-push-payload.interface';
import { PushRepository } from './push.repository';

@Injectable()
export class PushService implements OnModuleInit {
  constructor(
    private readonly pushRepository: PushRepository,
    private readonly chatMembersService: ChatMembersService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PushService.name);
  }

  public onModuleInit(): void {
    webPush.setVapidDetails(
      this.config.get<string>('VAPID_SUBJECT')!,
      this.config.get<string>('VAPID_PUBLIC_KEY')!,
      this.config.get<string>('VAPID_PRIVATE_KEY')!,
    );

    this.logger.info(
      'onModuleInit',
      {},
      'Web-push VAPID details configured globally',
    );
  }

  public getVapidPublicKey(): VapidPublicKeyDto {
    return plainToInstance(
      VapidPublicKeyDto,
      { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') },
      { excludeExtraneousValues: true },
    );
  }

  public async subscribe(
    userId: number,
    sessionId: number,
    dto: SubscribePushDto,
    userAgent: string | null,
  ): Promise<PushSubscriptionDto> {
    const saved = await this.pushRepository.upsertByEndpoint({
      userId,
      sessionId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent,
    });

    this.logger.info(
      'subscribe',
      { userId, sessionId, subscriptionId: saved.id },
      'Push subscription registered',
    );

    return plainToInstance(PushSubscriptionDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  public async unsubscribe(userId: number, endpoint: string): Promise<void> {
    const affected = await this.pushRepository.deleteByEndpointAndUser(
      endpoint,
      userId,
    );

    this.logger.info(
      'unsubscribe',
      { userId, affected },
      'Push subscription unsubscribe',
    );
  }

  public async listMine(userId: number): Promise<PushSubscriptionDto[]> {
    const subscriptions = await this.pushRepository.findByUserId(userId);

    return plainToInstance(PushSubscriptionDto, subscriptions, {
      excludeExtraneousValues: true,
    });
  }

  public async deliverForMessage(event: MessageCreatedEvent): Promise<void> {
    const { chatId, message } = event;

    const participantIds =
      await this.chatMembersService.findChatParticipantIds(chatId);

    const recipientIds = participantIds.filter((id) => id !== message.senderId);

    if (recipientIds.length === 0) {
      return;
    }

    const subscriptions = await this.pushRepository.findByUserIds(recipientIds);
    if (subscriptions.length === 0) {
      this.logger.debug(
        'deliverForMessage',
        {
          chatId,
          messageId: message.id,
          recipients: recipientIds.length,
          total: 0,
        },
        'Push fan-out skipped — no subscriptions for recipients (no devices OR all opted out)',
      );

      return;
    }

    const payload: WebPushPayload = {
      title: message.sender.nickname,
      body: message.content?.trim() || '[Attachment]',
      url: `/chats/${chatId}`,
      chatId,
      messageId: message.id,
    };

    const body = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map((subscription) => this.sendOne(subscription, body)),
    );

    let sent = 0;
    let pruned = 0;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      const subscription = subscriptions[i];

      if (result.status === 'fulfilled') {
        sent++;
        continue;
      }

      if (this.isGoneError(result.reason)) {
        await this.pushRepository.deleteById(subscription.id);
        pruned++;
      } else {
        const error = result.reason as Error;

        this.logger.warn(
          'deliverForMessage',
          {
            subscriptionId: subscription.id,
            errorMessage: error.message,
          },
          'Push delivery failed (non-stale error)',
        );
      }
    }

    this.logger.info(
      'deliverForMessage',
      {
        chatId,
        messageId: message.id,
        total: subscriptions.length,
        sent,
        pruned,
      },
      'Push fan-out finished',
    );
  }

  private async sendOne(
    subscription: PushSubscriptionEntity,
    body: string,
  ): Promise<void> {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      body,
    );
  }

  private isGoneError(error: unknown): boolean {
    return (
      error instanceof WebPushError &&
      (error.statusCode === 404 || error.statusCode === 410)
    );
  }
}
