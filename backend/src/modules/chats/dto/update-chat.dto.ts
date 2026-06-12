import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateChatDto {
  @ApiProperty({
    example: 'Project Alpha',
    minLength: 1,
    maxLength: 100,
    description: 'New group name. Same length constraints as on creation.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
