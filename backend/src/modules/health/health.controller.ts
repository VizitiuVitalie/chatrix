import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { BackendHealthIndicator } from './indicators/backend.indicator';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { MinioHealthIndicator } from './indicators/minio.indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheck: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly backend: BackendHealthIndicator,
    private readonly minio: MinioHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Liveness + readiness probe (backend, database, MinIO). 200 if all up; 503 with details otherwise.',
  })
  @ApiOkResponse({ description: 'All components healthy' })
  @ApiServiceUnavailableResponse({
    description: 'One or more components unhealthy',
  })
  public async check(): Promise<HealthCheckResult> {
    return this.healthCheck.check([
      () => this.backend.check('backend'),
      () => this.database.check('database'),
      () => this.minio.check('minio'),
    ]);
  }
}
