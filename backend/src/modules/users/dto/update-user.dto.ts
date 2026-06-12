import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BIO_MAX_LENGTH } from '../constants/users.constants';
import { Theme } from '../enums/theme.enum';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Alice Smith',
    minLength: 2,
    maxLength: 64,
    required: false,
    description:
      'Display name shown in chats. Cannot start or end with whitespace; mid-word spaces are allowed.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^\S(.*\S)?$/, {
    message: 'nickname must not start or end with whitespace',
  })
  nickname?: string;

  @ApiProperty({
    example: 'Hi, I am Alice',
    maxLength: BIO_MAX_LENGTH,
    required: false,
    nullable: true,
    description:
      'Free-form profile blurb. Pass an empty string or `null` to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX_LENGTH)
  bio?: string | null;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Per-user push-notification preference. Toggling this also has the side-effect of unsubscribing future pushes server-side: a `false` user never receives a push even if a subscription row still exists.',
  })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiProperty({
    enum: Theme,
    required: false,
    description:
      'Per-user UI theme preference. Persisted so the choice carries across devices.',
  })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;
}
