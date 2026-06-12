import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_FILES_PER_MESSAGE } from '../../files/constants/files.constants';
import {
  CLIENT_MESSAGE_ID_MAX_LENGTH,
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from '../constants/messages.constants';

export class CreateMessageDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    example: 'Hello, how are you?',
    required: false,
    minLength: MIN_MESSAGE_LENGTH,
    maxLength: MAX_MESSAGE_LENGTH,
    description:
      'Message body. Optional when `fileIds` is non-empty (media-only send is allowed); otherwise required. If present: respects the length bounds AND must contain at least one non-whitespace character (a bare " " or "   " is rejected). The service additionally rejects requests where neither `content` nor `fileIds` carries data.',
  })
  @IsOptional()
  @IsString()
  @MinLength(MIN_MESSAGE_LENGTH)
  @MaxLength(MAX_MESSAGE_LENGTH)
  @Matches(/\S/, {
    message: 'content must contain at least one non-whitespace character',
  })
  content?: string;

  @ApiProperty({
    type: Number,
    isArray: true,
    required: false,
    example: [42, 43],
    description:
      "Optional ids of files (from POST /api/files) to claim as attachments. Up to MAX_FILES_PER_MESSAGE per message. Each id must be the caller's unclaimed MESSAGE_ATTACHMENT upload.",
    maxItems: MAX_FILES_PER_MESSAGE,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILES_PER_MESSAGE)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  fileIds?: number[];

  @ApiProperty({
    example: '7f3e2c10-9b4a-4f6e-8a1d-2c5f0b8e9a31',
    required: false,
    maxLength: CLIENT_MESSAGE_ID_MAX_LENGTH,
    description:
      'Client-generated correlation id (UUID). Echoed back on the response (and the message:created broadcast) so the sender swaps its optimistic bubble in place. Also persisted as an idempotency key, unique per sender: a retried send carrying the same id returns the original message instead of creating a duplicate.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CLIENT_MESSAGE_ID_MAX_LENGTH)
  @Matches(/\S/, {
    message: 'clientId must contain at least one non-whitespace character',
  })
  clientId?: string;
}
