import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { UserDto } from '../../users/dto/user.dto';
import { ChatMemberRole } from '../enums/chat-member-role.enum';

export class ChatMemberDto extends AbstractDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Expose()
  chatId: number;

  @ApiProperty({ example: 42 })
  @IsInt()
  @Expose()
  userId: number;

  @ApiProperty({ enum: ChatMemberRole, example: ChatMemberRole.MEMBER })
  @IsEnum(ChatMemberRole)
  @Expose()
  role: ChatMemberRole;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: '2026-05-12T18:32:00.000Z',
    description: 'Timestamp of the latest message read by this member',
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  lastReadAt: Date | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: null,
    description:
      "Per-user 'clear history' marker (direct chats only). When set, the member sees only messages with createdAt >= this timestamp; the chat is hidden from their list until a newer message arrives.",
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  chatHistoryClearedAt: Date | null;

  @ApiProperty({ type: UserDto })
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}
