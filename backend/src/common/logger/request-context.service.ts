import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { LogContext } from './interfaces/log-context.interface';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<LogContext>();

  public run<T>(context: LogContext, fn: () => T): T {
    return this.storage.run({ ...context }, fn);
  }

  public set<K extends keyof LogContext>(key: K, value: LogContext[K]): void {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }

  public get(): LogContext {
    return this.storage.getStore() ?? {};
  }
}
