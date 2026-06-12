import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../chat-members/entities/chat-member.entity';
import { UserEntity } from './entities/user.entity';
import { UserEventsListener } from './listeners/user-events.listener';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ChatMemberEntity])],
  providers: [UsersService, UsersRepository, UserEventsListener],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
