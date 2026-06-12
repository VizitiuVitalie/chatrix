import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { AppLogger } from '../../../common/logger/app-logger.service';
import { StorageService } from '../../../core/storage/storage.service';

@Injectable()
export class MinioHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly storage: StorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MinioHealthIndicator.name);
  }

  public async check(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const ok = await this.storage.isHealthy();

    if (ok) {
      return indicator.up();
    }

    this.logger.warn(
      'check',
      { component: key },
      'Storage health check failed',
    );
    return indicator.down({ reason: 'storage backend unreachable' });
  }
}
