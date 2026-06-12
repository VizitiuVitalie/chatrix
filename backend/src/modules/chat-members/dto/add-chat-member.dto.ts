import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ChatMemberRole } from '../enums/chat-member-role.enum';

export class AddChatMemberDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({ example: 42 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({
    enum: [ChatMemberRole.ADMIN, ChatMemberRole.MEMBER],
    example: ChatMemberRole.MEMBER,
    required: false,
    default: ChatMemberRole.MEMBER,
  })
  @IsEnum([ChatMemberRole.ADMIN, ChatMemberRole.MEMBER])
  @IsOptional()
  role?: ChatMemberRole;
}
