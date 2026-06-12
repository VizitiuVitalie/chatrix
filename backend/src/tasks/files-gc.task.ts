import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '../common/logger/app-logger.service';
import { FilesService } from '../modules/files/files.service';

@Injectable()
export class FilesGcTask {
  constructor(
    private readonly filesService: FilesService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FilesGcTask.name);
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async runOrphanSweep(): Promise<void> {
    this.logger.debug('runOrphanSweep', {}, 'Cron tick — sweeping orphans');
    try {
      await this.filesService.sweepOrphanAttachments();
      await this.filesService.sweepOrphanAvatars();
    } catch (err) {
      this.logger.error(
        'runOrphanSweep',
        { err: (err as Error).message },
        'Orphan sweep failed',
      );
    }
  }
}
