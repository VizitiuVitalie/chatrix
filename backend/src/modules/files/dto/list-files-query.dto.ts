import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FileSort } from '../enums/file-sort.enum';

export class ListFilesQueryDto {
  @ApiPropertyOptional({
    enum: FileSort,
    default: FileSort.SIZE_DESC,
    description:
      'Sort order. `size_desc` (default) puts heaviest files first — best for the "free up space" flow.',
  })
  @IsEnum(FileSort)
  @IsOptional()
  sort?: FileSort = FileSort.SIZE_DESC;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
