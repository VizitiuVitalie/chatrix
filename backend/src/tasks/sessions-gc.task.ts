import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '../common/logger/app-logger.service';
import { SessionsService } from '../modules/sessions/sessions.service';

@Injectable()
export class SessionsGcTask {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SessionsGcTask.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async runExpiredSweep(): Promise<void> {
    this.logger.debug(
      'runExpiredSweep',
      {},
      'Cron tick — purging expired sessions',
    );

    try {
      await this.sessionsService.purgeExpired();
    } catch (err) {
      this.logger.error(
        'runExpiredSweep',
        { err: (err as Error).message },
        'Expired sessions sweep failed',
      );
    }
  }
}
