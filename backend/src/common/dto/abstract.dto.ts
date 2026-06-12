import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export abstract class AbstractDto {
  @ApiProperty({
    type: Date,
    example: '2026-05-07T10:30:00.000Z',
    description: 'Record creation timestamp (UTC)',
  })
  @IsDate()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2026-05-07T10:30:00.000Z',
    description: 'Last update timestamp (UTC)',
  })
  @IsDate()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: null,
    description: 'Soft-delete timestamp; null if not deleted',
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  deletedAt: Date | null;
}
