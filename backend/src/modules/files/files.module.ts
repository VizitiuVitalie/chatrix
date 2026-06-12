import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { ChatsModule } from '../chats/chats.module';
import { UsersModule } from '../users/users.module';
import { FileEntity } from './entities/file.entity';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    UsersModule,
    ChatMembersModule,
    ChatsModule,
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: config.get<number>('MAX_UPLOAD_SIZE_MB')! * 1024 * 1024,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService],
})
export class FilesModule {}
