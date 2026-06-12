import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateDirectChatDto {
  @ApiProperty({
    example: 42,
    description: 'Id of the peer user. The current user is the other side.',
  })
  @IsInt()
  @IsPositive()
  targetUserId: number;
}
