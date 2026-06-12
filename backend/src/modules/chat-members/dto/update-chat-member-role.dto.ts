import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ChatMemberRole } from '../enums/chat-member-role.enum';

export class UpdateChatMemberRoleDto {
  @ApiProperty({ enum: ChatMemberRole, example: ChatMemberRole.ADMIN })
  @IsEnum(ChatMemberRole)
  role: ChatMemberRole;
}
