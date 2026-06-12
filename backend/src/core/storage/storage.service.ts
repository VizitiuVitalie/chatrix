import { Readable } from 'node:stream';

import { StoragePutOptions } from './interfaces/storage-put-options.interface';

export abstract class StorageService {
  abstract put(
    key: string,
    body: Buffer,
    options: StoragePutOptions,
  ): Promise<void>;

  abstract getStream(key: string): Promise<Readable>;

  abstract delete(key: string): Promise<void>;

  abstract exists(key: string): Promise<boolean>;

  abstract getPublicUrl(key: string): string;

  abstract isHealthy(): Promise<boolean>;
}
