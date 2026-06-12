import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { AppLogger } from '../../common/logger/app-logger.service';
import type { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SocketAuthService.name);
  }

  public async verifyHandshake(socket: Socket): Promise<AuthenticatedUser> {
    const auth = socket.handshake.auth as { token?: unknown } | undefined;

    const token = auth?.token;

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Missing JWT in handshake.auth.token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      return { id: payload.sub, sessionId: payload.sessionId };
    } catch (err) {
      this.logger.warn(
        'verifyHandshake',
        { reason: (err as Error).message },
        'WS handshake JWT verification failed',
      );

      throw new UnauthorizedException('Invalid JWT');
    }
  }
}
