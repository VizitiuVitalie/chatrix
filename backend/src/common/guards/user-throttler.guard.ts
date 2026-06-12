import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as { id?: unknown } | undefined;

    if (user && typeof user.id === 'number') {
      return Promise.resolve(`user-${user.id}`);
    }

    const ip: unknown = req.ip;

    return Promise.resolve(typeof ip === 'string' ? ip : 'unknown');
  }

  protected getErrorMessage(
    _context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<string> {
    const seconds = Math.max(1, Math.ceil(detail.timeToBlockExpire));

    return Promise.resolve(
      `Too many requests — please slow down and try again in ${seconds}s.`,
    );
  }
}
