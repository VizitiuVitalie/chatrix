import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { BackendHealthIndicator } from './indicators/backend.indicator';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { MinioHealthIndicator } from './indicators/minio.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    BackendHealthIndicator,
    DatabaseHealthIndicator,
    MinioHealthIndicator,
  ],
})
export class HealthModule {}
