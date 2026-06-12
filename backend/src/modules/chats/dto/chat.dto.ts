import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { ChatMemberDto } from '../../chat-members/dto/chat-member.dto';
import { ChatType } from '../enums/chat-type.enum';
import { ChatLastMessageDto } from './chat-last-message.dto';

export class ChatDto extends AbstractDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ enum: ChatType, example: ChatType.GROUP })
  @IsEnum(ChatType)
  @Expose()
  type: ChatType;

  @ApiProperty({
    example: 'Project Alpha',
    nullable: true,
    description: 'Group title; null for direct chats',
  })
  @IsString()
  @IsOptional()
  @Expose()
  name: string | null;

  @ApiProperty({
    example: 'http://localhost:9000/chatrix-files/avatars/...',
    nullable: true,
    description:
      "Public URL of the group's avatar. Computed server-side from the `avatar_file_id` FK; `null` if no avatar is set (always null for direct chats).",
  })
  @IsString()
  @IsOptional()
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({
    example: 'http://localhost:9000/chatrix-files/avatars/...-thumb',
    nullable: true,
    description:
      "Public URL of the smaller WebP thumbnail (max 256px) for the group's avatar. Lower-bandwidth variant for dense lists; falls back to `null` if no avatar is set or the avatar predates thumbnail generation.",
  })
  @IsString()
  @IsOptional()
  @Expose()
  thumbnailUrl: string | null;

  @ApiProperty({
    example: 5,
    nullable: true,
    description: 'User who created the chat; null if that user was deleted',
  })
  @IsInt()
  @IsOptional()
  @Expose()
  createdById: number | null;

  @ApiProperty({ type: ChatMemberDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => ChatMemberDto)
  members: ChatMemberDto[];

  @ApiProperty({
    type: ChatLastMessageDto,
    nullable: true,
    description:
      'Preview of the latest message in this chat; null when the chat has never received a message or its last message was hard-deleted.',
  })
  @ValidateNested()
  @IsOptional()
  @Expose()
  @Type(() => ChatLastMessageDto)
  lastMessage: ChatLastMessageDto | null;
}
