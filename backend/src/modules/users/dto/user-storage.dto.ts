import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UserStorageDto {
  @ApiProperty({
    example: 12_582_912,
    description: "Bytes currently stored across all the user's files.",
  })
  @IsInt()
  @Expose()
  usedBytes: number;

  @ApiProperty({
    example: 524_288_000,
    description:
      'Per-user storage cap (from DEFAULT_USER_QUOTA_MB). Reached → 413 on upload.',
  })
  @IsInt()
  @Expose()
  quotaBytes: number;

  @ApiProperty({
    example: 2,
    description: 'Rounded percent used. Convenience field for UI progress bar.',
  })
  @IsInt()
  @Expose()
  percentUsed: number;
}
