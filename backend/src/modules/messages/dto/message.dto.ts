import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { FileDto } from '../../files/dto/file.dto';
import { UserDto } from '../../users/dto/user.dto';

export class MessageDto extends AbstractDto {
  @ApiProperty({ example: 1001 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Expose()
  chatId: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Expose()
  senderId: number;

  @ApiProperty({
    example: 'Hello, how are you?',
    nullable: true,
    description:
      'Message body. `null` for media-only messages (the message must then carry at least one entry in `files`).',
  })
  @IsString()
  @IsOptional()
  @Expose()
  content: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: null,
    description: 'Set when the message has been edited (Phase 6)',
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  editedAt: Date | null;

  @ApiProperty({ type: UserDto })
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  sender: UserDto;

  @ApiProperty({
    type: FileDto,
    isArray: true,
    description:
      'Attachments claimed by this message via `fileIds` in POST /api/messages. Empty array when the message has no attachments.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => FileDto)
  files: FileDto[];

  @ApiProperty({
    nullable: true,
    example: '7f3e2c10-9b4a-4f6e-8a1d-2c5f0b8e9a31',
    description:
      'Echo of the client-generated correlation id from POST /api/messages. `null` for messages sent without one (history before this feature, server seeds). Lets the originating client swap its optimistic bubble in place without a duplicate.',
  })
  @IsString()
  @IsOptional()
  @Expose()
  clientId: string | null = null;
}
