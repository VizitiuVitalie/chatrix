import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export const Cookies = createParamDecorator(
  (
    key: string | undefined,
    ctx: ExecutionContext,
  ): string | Record<string, string> | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const cookies = request.cookies as Record<string, string> | undefined;

    if (!cookies) {
      return undefined;
    }

    return key ? cookies[key] : cookies;
  },
);
