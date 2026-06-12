import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { UsersModule } from '../users/users.module';
import { ChatsController } from './chats.controller';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';
import { ChatEntity } from './entities/chat.entity';
import { ChatEventsListener } from './listeners/chat-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatEntity]),
    ChatMembersModule,
    UsersModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository, ChatEventsListener],
  exports: [ChatsService],
})
export class ChatsModule {}
