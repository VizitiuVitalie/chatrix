import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiPropertyOptional({
    example: 1001,
    description:
      'Return messages with id < before. Omit on first page to get the latest messages.',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  before?: number;

  @ApiPropertyOptional({
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
