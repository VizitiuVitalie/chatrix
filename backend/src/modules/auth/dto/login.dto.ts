import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'alice_2026',
    minLength: 3,
    maxLength: 32,
    description: 'Login handle. ASCII letters, digits, "_", ".", "-" only.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message: 'username must contain only letters, digits, "_", ".", "-"',
  })
  username: string;

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
}
