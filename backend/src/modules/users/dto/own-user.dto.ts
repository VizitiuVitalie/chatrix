import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { Theme } from '../enums/theme.enum';

export class OwnUserDto extends AbstractDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ example: 'alice_2026' })
  @IsString()
  @Expose()
  username: string;

  @ApiProperty({ example: 'alice@example.com', nullable: true })
  @IsString()
  @IsOptional()
  @Expose()
  email: string | null;

  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  @Expose()
  nickname: string;

  @ApiProperty({ example: 'http://localhost:9000/...', nullable: true })
  @IsString()
  @IsOptional()
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({ example: 'http://localhost:9000/...-thumb', nullable: true })
  @IsString()
  @IsOptional()
  @Expose()
  thumbnailUrl: string | null;

  @ApiProperty({ example: 'Hi, I am Alice', nullable: true })
  @IsString()
  @IsOptional()
  @Expose()
  bio: string | null;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  isOnline: boolean;

  @ApiProperty({ example: '2026-06-09T18:42:11.000Z', nullable: true })
  @IsDate()
  @IsOptional()
  @Expose()
  lastSeenAt: Date | null;

  @ApiProperty({
    example: true,
    description:
      'Per-user push-notification preference. Owner-only: never exposed on UserDto (which other users receive).',
  })
  @IsBoolean()
  @Expose()
  pushEnabled: boolean;

  @ApiProperty({
    enum: Theme,
    example: Theme.SYSTEM,
    description:
      'Per-user UI theme preference. Owner-only: never exposed on UserDto.',
  })
  @IsEnum(Theme)
  @Expose()
  theme: Theme;
}
