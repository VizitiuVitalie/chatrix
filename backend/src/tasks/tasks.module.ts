import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FilesModule } from '../modules/files/files.module';
import { SessionsModule } from '../modules/sessions/sessions.module';
import { FilesGcTask } from './files-gc.task';
import { SessionsGcTask } from './sessions-gc.task';

@Module({
  imports: [ScheduleModule.forRoot(), FilesModule, SessionsModule],
  providers: [FilesGcTask, SessionsGcTask],
})
export class TasksModule {}
