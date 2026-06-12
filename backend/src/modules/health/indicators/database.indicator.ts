import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DatabaseHealthIndicator.name);
  }

  public async check(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.db.pingCheck(key);
      return indicator.up();
    } catch (error) {
      this.logger.warn(
        'check',
        { component: key },
        'Database health check failed',
      );
      this.logger.debug(
        'check',
        { component: key, error: String(error) },
        'Database health check error detail',
      );
      return indicator.down({ reason: 'database unreachable' });
    }
  }
}
