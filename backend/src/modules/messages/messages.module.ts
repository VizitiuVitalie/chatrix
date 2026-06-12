import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { ChatsModule } from '../chats/chats.module';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { MessageEntity } from './entities/message.entity';
import { MessageEventsListener } from './listeners/message-events.listener';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity]),
    ChatsModule,
    ChatMembersModule,
    FilesModule,
    UsersModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, MessageEventsListener],
  exports: [MessagesService],
})
export class MessagesModule {}
