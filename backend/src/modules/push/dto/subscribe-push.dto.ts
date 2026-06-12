import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { PushSubscriptionKeysDto } from './push-subscription-keys.dto';

export class SubscribePushDto {
  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/d4Z-Y7BfA0o:APA91bF...',
    description:
      'Push-service URL issued by the browser. Globally unique; the same device cannot have two active subscriptions for the same VAPID key.',
  })
  @IsString()
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @MaxLength(1024)
  endpoint: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}
