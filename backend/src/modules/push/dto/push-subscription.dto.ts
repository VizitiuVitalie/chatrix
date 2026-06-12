import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';

export class PushSubscriptionDto extends AbstractDto {
  @ApiProperty({ example: 17 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    example: 42,
    description:
      'Session that performed the subscription. Logout (session revoke) automatically removes this row via FK CASCADE.',
  })
  @IsInt()
  @Expose()
  sessionId: number;

  @ApiProperty({
    nullable: true,
    example: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/138.0',
    description:
      'User-Agent header at subscription time. Used by the "subscribed devices" settings UI.',
  })
  @IsString()
  @IsOptional()
  @Expose()
  userAgent: string | null;
}
