import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { NODE_ENV } from '../../common/enums/node-env.enum';
import { EnvVars } from './env.validation';

export const buildDatabaseConfig = (env: EnvVars): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  schema: env.POSTGRES_SCHEMA,
  autoLoadEntities: true,
  synchronize: false,
  logging:
    env.NODE_ENV === NODE_ENV.PRODUCTION
      ? ['error']
      : ['error', 'warn', 'migration'],
});
