import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from '../constants/messages.constants';

export class UpdateMessageDto {
  @ApiProperty({
    example: 'Hello, how are you doing today?',
    minLength: MIN_MESSAGE_LENGTH,
    maxLength: MAX_MESSAGE_LENGTH,
    description:
      'New message body. Must respect the length bounds AND contain at least one non-whitespace character.',
  })
  @IsString()
  @MinLength(MIN_MESSAGE_LENGTH)
  @MaxLength(MAX_MESSAGE_LENGTH)
  @Matches(/\S/, {
    message: 'content must contain at least one non-whitespace character',
  })
  content: string;
}
