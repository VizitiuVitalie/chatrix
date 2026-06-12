import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from '../chats/entities/chat.entity';
import { UsersModule } from '../users/users.module';
import { ChatMembersController } from './chat-members.controller';
import { ChatMembersRepository } from './chat-members.repository';
import { ChatMembersService } from './chat-members.service';
import { ChatMemberEntity } from './entities/chat-member.entity';
import { ChatMemberEventsListener } from './listeners/chat-member-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMemberEntity, ChatEntity]),
    UsersModule,
  ],
  controllers: [ChatMembersController],
  providers: [
    ChatMembersService,
    ChatMembersRepository,
    ChatMemberEventsListener,
  ],
  exports: [ChatMembersService],
})
export class ChatMembersModule {}
