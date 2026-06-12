import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../common/logger/app-logger.service';
import {
  DomainEvent,
  type SessionRevokedEvent,
  type SessionsRevokedAllEvent,
} from '../../../events/domain-events';
import { PushRepository } from '../push.repository';

@Injectable()
export class PushSessionListener {
  constructor(
    private readonly pushRepository: PushRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PushSessionListener.name);
  }

  @OnEvent(DomainEvent.SESSION_REVOKED)
  public async handleSessionRevoked(event: SessionRevokedEvent): Promise<void> {
    const affected = await this.pushRepository.deleteBySessionId(
      event.sessionId,
    );

    this.logger.info(
      'handleSessionRevoked',
      { sessionId: event.sessionId, userId: event.userId, affected },
      'Push subscriptions cleared for revoked session',
    );
  }

  @OnEvent(DomainEvent.SESSIONS_REVOKED_ALL)
  public async handleSessionsRevokedAll(
    event: SessionsRevokedAllEvent,
  ): Promise<void> {
    const affected = await this.pushRepository.deleteByUserId(event.userId);

    this.logger.info(
      'handleSessionsRevokedAll',
      { userId: event.userId, affected },
      'Push subscriptions cleared for user (logout-all)',
    );
  }
}
