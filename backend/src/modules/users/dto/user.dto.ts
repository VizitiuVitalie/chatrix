import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';

export class UserDto extends AbstractDto {
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

  @ApiProperty({
    example: 'http://localhost:9000/chatrix-files/avatars/...',
    nullable: true,
    description:
      "Public URL of the user's avatar. Computed server-side from the `avatar_file_id` FK; `null` if no avatar is set.",
  })
  @IsString()
  @IsOptional()
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({
    example: 'http://localhost:9000/chatrix-files/avatars/...-thumb',
    nullable: true,
    description:
      "Public URL of the smaller WebP thumbnail (max 256px) for the user's avatar. Lower-bandwidth variant suitable for dense lists like search results or chat-list rows; falls back to `null` if no avatar is set or the avatar predates thumbnail generation.",
  })
  @IsString()
  @IsOptional()
  @Expose()
  thumbnailUrl: string | null;

  @ApiProperty({ example: 'Hi, I am Alice', nullable: true })
  @IsString()
  @IsOptional()
  @Expose()
  bio: string | null;

  @ApiProperty({
    example: true,
    description:
      'Computed: `true` if the user has at least one live Socket.io connection at the moment this DTO is serialised. Live updates flow via the `user:presence` WS event so callers can patch their cache without re-fetching.',
  })
  @IsBoolean()
  @Expose()
  isOnline: boolean;

  @ApiProperty({
    example: '2026-06-09T18:42:11.000Z',
    nullable: true,
    description:
      "Moment when the user's LAST socket disconnected. `null` while the user is currently online (read `isOnline` first) and for users that have never connected. Live updates ride on the `user:presence` WS event — its `lastSeenAt` field carries the freshly stamped timestamp alongside `isOnline: false`.",
  })
  @IsDate()
  @IsOptional()
  @Expose()
  lastSeenAt: Date | null;
}
