import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alice_2026',
    minLength: 3,
    maxLength: 32,
    description:
      'Unique login handle. ASCII letters, digits, "_", ".", "-" only. No whitespace. Uniqueness enforced server-side — 409 Conflict on collision.',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message: 'username must contain only letters, digits, "_", ".", "-"',
  })
  username: string;

  @ApiProperty({
    example: 'alice@example.com',
    required: false,
    nullable: true,
    description:
      'Optional at registration; can be filled later in profile. Must be a valid email and contain no whitespace. Unique server-side when provided — 409 Conflict on collision.',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'email must not contain whitespace' })
  email?: string;

  @ApiProperty({
    example: 'P@ssword12',
    minLength: 8,
    maxLength: 128,
    description: 'Must not contain whitespace.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^\S+$/, { message: 'password must not contain whitespace' })
  password: string;

  @ApiProperty({
    example: 'Alice Smith',
    minLength: 2,
    maxLength: 64,
    description:
      'Display name shown in chats. Cannot start or end with whitespace; mid-word spaces are allowed (e.g. "Alice Smith"). Trimmed after validation as a safety net.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^\S(.*\S)?$/, {
    message: 'nickname must not start or end with whitespace',
  })
  nickname: string;
}
