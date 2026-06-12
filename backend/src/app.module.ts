import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppLoggerModule } from './common/logger/app-logger.module';
import { RequestContextMiddleware } from './common/logger/request-context.middleware';
import { UserContextInterceptor } from './common/logger/user-context.interceptor';
import { envValidationSchema } from './core/config/env.validation';
import { DatabaseModule } from './core/database/database.module';
import { StorageModule } from './core/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatMembersModule } from './modules/chat-members/chat-members.module';
import { ChatsModule } from './modules/chats/chats.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PushModule } from './modules/push/push.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { SocketsModule } from './sockets/sockets.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
      ],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              }
            : undefined,
        autoLogging: true,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      verboseMemoryLeak: true,
    }),
    AppLoggerModule,
    DatabaseModule,
    StorageModule,
    HealthModule,
    UsersModule,
    SessionsModule,
    AuthModule,
    ChatsModule,
    ChatMembersModule,
    MessagesModule,
    FilesModule,
    PushModule,
    SocketsModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
