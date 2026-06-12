import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDatabaseConfig } from '../config/database.config';
import { validateEnv } from '../config/env.validation';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDatabaseConfig(validateEnv(process.env)),
    }),
  ],
})
export class DatabaseModule {}
