import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

interface ResolvedError {
  status: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (this.isClientDisconnect(exception)) {
      this.logger.debug(
        `${request.method} ${request.url} aborted by client (multer/body stream interrupted)`,
      );
      return;
    }

    const { status, message, error } = this.resolveError(exception);

    this.logException(exception, request, status, message);

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private isClientDisconnect(exception: unknown): boolean {
    return (
      exception instanceof Error && exception.message === 'Request aborted'
    );
  }

  private resolveError(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { status, message: res, error: exception.name };
      }
      const r = res as { message?: string | string[]; error?: string };
      return {
        status,
        message: r.message ?? exception.message,
        error: r.error ?? exception.name,
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Entity not found',
        error: 'EntityNotFoundError',
      };
    }

    if (exception instanceof QueryFailedError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database query failed',
        error: 'QueryFailedError',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }

  private logException(
    exception: unknown,
    request: Request,
    status: number,
    message: string | string[],
  ): void {
    const contextLine = `${request.method} ${request.url} → ${status}`;
    const messageLine = Array.isArray(message) ? message.join('; ') : message;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${contextLine}: ${messageLine}`, stack);
    } else if (status >= 400) {
      this.logger.warn(`${contextLine}: ${messageLine}`);
    }
  }
}
