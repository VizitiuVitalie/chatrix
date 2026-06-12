import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildDatabaseConfig } from '../config/database.config';
import { validateEnv } from '../config/env.validation';

const env = validateEnv(process.env);

const cliOptions: DataSourceOptions = {
  ...buildDatabaseConfig(env),
  entities: [
    join(__dirname, '..', '..', 'modules', '**', 'entities', '*.entity.ts'),
    join(__dirname, '..', '..', 'modules', '**', 'entities', '*.entity.js'),
  ],
  migrations: [
    join(__dirname, 'migrations', '*.ts'),
    join(__dirname, 'migrations', '*.js'),
  ],
  logging: false,
} as DataSourceOptions;

export default new DataSource(cliOptions);
