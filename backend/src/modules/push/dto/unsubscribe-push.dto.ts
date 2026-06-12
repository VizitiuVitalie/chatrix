import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength } from 'class-validator';

export class UnsubscribePushDto {
  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/d4Z-Y7BfA0o:APA91bF...',
  })
  @IsString()
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @MaxLength(1024)
  endpoint: string;
}
