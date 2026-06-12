import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { createHash, randomBytes } from 'node:crypto';
import ms, { StringValue } from 'ms';
import { AppLogger } from '../../common/logger/app-logger.service';
import {
  DomainEvent,
  type SessionRevokedEvent,
  type SessionsRevokedAllEvent,
} from '../../events/domain-events';
import { SessionDto } from './dto/session.dto';
import { SessionWithRawToken } from './interfaces/session-with-raw-token.interface';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SessionsService.name);
  }

  public async createSession(
    userId: number,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<SessionWithRawToken> {
    const rawRefreshToken = this.generateRawToken();
    const ttlMs = ms(this.config.get<StringValue>('REFRESH_TTL')!);
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = await this.sessionsRepository.create({
      userId,
      refreshTokenHash: this.hashToken(rawRefreshToken),
      previousRefreshTokenHash: null,
      userAgent,
      ipAddress,
      expiresAt,
      lastUsedAt: null,
    });

    this.logger.info(
      'createSession',
      { userId, sessionId: session.id },
      'Session created',
    );

    return { session, rawRefreshToken };
  }

  public async rotateRefreshToken(
    rawToken: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<SessionWithRawToken> {
    const incomingHash = this.hashToken(rawToken);

    const active =
      await this.sessionsRepository.findActiveByCurrentHash(incomingHash);
    if (active) {
      const newRawToken = this.generateRawToken();
      const applied = await this.sessionsRepository.rotateIfCurrent(
        active.id,
        incomingHash,
        this.hashToken(newRawToken),
        ipAddress,
        userAgent,
      );

      if (!applied) {
        this.logger.warn(
          'rotateRefreshToken',
          { sessionId: active.id, userId: active.userId },
          'Refresh token rotation lost to a concurrent request',
        );

        throw new UnauthorizedException('Refresh token rotated concurrently');
      }

      const updated = await this.sessionsRepository.findById(active.id);
      if (!updated) {
        throw new UnauthorizedException('Session disappeared during rotation');
      }

      this.logger.info(
        'rotateRefreshToken',
        { sessionId: active.id, userId: active.userId },
        'Refresh token rotated',
      );

      return { session: updated, rawRefreshToken: newRawToken };
    }

    const replayed =
      await this.sessionsRepository.findByPreviousHash(incomingHash);
    if (replayed) {
      await this.sessionsRepository.revoke(replayed.id);

      await this.eventEmitter.emitAsync(DomainEvent.SESSION_REVOKED, {
        sessionId: replayed.id,
        userId: replayed.userId,
      } satisfies SessionRevokedEvent);

      this.logger.warn(
        'rotateRefreshToken',
        { sessionId: replayed.id, userId: replayed.userId },
        'Refresh token reuse detected',
      );

      throw new ForbiddenException('Refresh token reuse detected');
    }

    this.logger.warn('rotateRefreshToken', {}, 'Invalid refresh token');
    throw new UnauthorizedException('Invalid refresh token');
  }

  public async revokeSession(sessionId: number, userId: number): Promise<void> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionsRepository.revoke(sessionId);

    this.logger.info('revokeSession', { sessionId, userId }, 'Session revoked');

    await this.eventEmitter.emitAsync(DomainEvent.SESSION_REVOKED, {
      sessionId,
      userId,
    } satisfies SessionRevokedEvent);
  }

  public async revokeByRefreshToken(rawToken: string): Promise<void> {
    const session = await this.sessionsRepository.findActiveByCurrentHash(
      this.hashToken(rawToken),
    );

    if (!session) {
      this.logger.info(
        'revokeByRefreshToken',
        {},
        'Logout: no active session for token (no-op)',
      );

      return;
    }

    await this.sessionsRepository.revoke(session.id);

    this.logger.info(
      'revokeByRefreshToken',
      { sessionId: session.id, userId: session.userId },
      'Session revoked on logout',
    );

    await this.eventEmitter.emitAsync(DomainEvent.SESSION_REVOKED, {
      sessionId: session.id,
      userId: session.userId,
    } satisfies SessionRevokedEvent);
  }

  public async revokeAllSessions(userId: number): Promise<void> {
    await this.sessionsRepository.revokeAllByUserId(userId);

    this.logger.info(
      'revokeAllSessions',
      { userId },
      'All sessions revoked for user',
    );

    await this.eventEmitter.emitAsync(DomainEvent.SESSIONS_REVOKED_ALL, {
      userId,
    } satisfies SessionsRevokedAllEvent);
  }

  public async listActiveSessions(userId: number): Promise<SessionDto[]> {
    const sessions = await this.sessionsRepository.findActiveByUserId(userId);

    return plainToInstance(SessionDto, sessions, {
      excludeExtraneousValues: true,
    });
  }

  public async purgeExpired(): Promise<number> {
    const affected = await this.sessionsRepository.purgeExpired();

    this.logger.info('purgeExpired', { affected }, 'Expired sessions purged');

    return affected;
  }

  private generateRawToken(): string {
    return randomBytes(64).toString('base64url');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
