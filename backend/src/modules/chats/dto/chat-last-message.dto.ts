import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';

export class ChatLastMessageDto extends AbstractDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Expose()
  senderId: number;

  @ApiProperty({
    example: 'Maya',
    description:
      "Sender's display name at read time; falls back to an empty string if the sender's user row was hard-deleted (impossible under normal CASCADE flow but defended against).",
  })
  @IsString()
  @Expose()
  senderNickname: string;

  @ApiProperty({
    example: 'Sounds good, see you tomorrow!',
    nullable: true,
    description:
      'Last message body. `null` when the latest message was a media-only send (no caption); the chat-list UI typically falls back to a "📎 Attachment" hint in that case.',
  })
  @IsString()
  @IsOptional()
  @Expose()
  content: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: null,
    description:
      'Set when the user edited the message content (PATCH /api/messages/:id within the 10-min edit window). Distinct from inherited `updatedAt`, which fires on ANY row update.',
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  editedAt: Date | null;
}
