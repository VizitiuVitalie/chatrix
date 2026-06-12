import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { MessageDto } from './message.dto';

export class MessagesPageDto {
  constructor(partial: Partial<MessagesPageDto>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: MessageDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MessageDto)
  items: MessageDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 951,
    description:
      'Pass as `before` in the next request to fetch older messages. null = no more history.',
  })
  @IsInt()
  @IsOptional()
  @Expose()
  nextCursor: number | null;
}
