import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';
import { PushMessageListener } from './listeners/push-message.listener';
import { PushSessionListener } from './listeners/push-session.listener';
import { PushController } from './push.controller';
import { PushRepository } from './push.repository';
import { PushService } from './push.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscriptionEntity]),
    ChatMembersModule,
  ],
  controllers: [PushController],
  providers: [
    PushService,
    PushRepository,
    PushMessageListener,
    PushSessionListener,
  ],
  exports: [PushService],
})
export class PushModule {}
