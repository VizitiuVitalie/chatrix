import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RequestContextService } from './request-context.service';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  constructor(
    private readonly pino: PinoLogger,
    private readonly contextService: RequestContextService,
  ) {}

  public setContext(context: string): void {
    this.pino.setContext(context);
  }

  public info(
    method: string,
    data: Record<string, unknown>,
    message: string,
  ): void {
    this.pino.info(this.buildPayload(method, data), message);
  }

  public warn(
    method: string,
    data: Record<string, unknown>,
    message: string,
  ): void {
    this.pino.warn(this.buildPayload(method, data), message);
  }

  public error(
    method: string,
    data: Record<string, unknown>,
    message: string,
    error?: unknown,
  ): void {
    this.pino.error(
      { ...this.buildPayload(method, data), err: error },
      message,
    );
  }

  public debug(
    method: string,
    data: Record<string, unknown>,
    message: string,
  ): void {
    this.pino.debug(this.buildPayload(method, data), message);
  }

  private buildPayload(
    method: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const ctx = this.contextService.get();
    return { ...ctx, method, ...data };
  }
}
