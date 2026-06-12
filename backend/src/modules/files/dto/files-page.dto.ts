import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { FileDto } from './file.dto';

export class FilesPageDto {
  constructor(partial: Partial<FilesPageDto>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: FileDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => FileDto)
  items: FileDto[];

  @ApiProperty({
    example: 42,
    description: 'Total alive files owned by the user (matches the filter).',
  })
  @IsInt()
  @Expose()
  total: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Expose()
  limit: number;
}
