import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SearchUsersQueryDto {
  @ApiProperty({
    example: 'alic',
    description:
      'Substring to match against `username` or `nickname` (case-insensitive). At least one non-whitespace character required; 1-64 characters.',
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/\S/, {
    message: 'q must contain at least one non-whitespace character',
  })
  public q: string;

  @ApiProperty({
    example: 20,
    description:
      'Maximum number of results to return. Defaults to 20; the server caps any value above 20.',
    minimum: 1,
    maximum: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  public limit?: number;
}
