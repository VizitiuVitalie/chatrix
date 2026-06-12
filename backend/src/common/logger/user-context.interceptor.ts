import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from './request-context.service';

interface RequestWithUser {
  user?: { id?: number };
}

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly contextService: RequestContextService) {}

  public intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (ctx.getType() === 'http') {
      const request = ctx.switchToHttp().getRequest<RequestWithUser>();
      const userId = request.user?.id;
      if (typeof userId === 'number') {
        this.contextService.set('userId', userId);
      }
    }
    return next.handle();
  }
}
