import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';

export class SessionDto extends AbstractDto {
  @ApiProperty({ example: 17, description: 'Session ID' })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Mozilla/5.0 (X11; Linux x86_64) ...',
    nullable: true,
    description: 'Browser / OS info captured at login or last refresh',
  })
  @IsString()
  @IsOptional()
  @Expose()
  userAgent: string | null;

  @ApiProperty({
    example: '192.168.1.42',
    nullable: true,
    description: 'IP address at last activity',
  })
  @IsString()
  @IsOptional()
  @Expose()
  ipAddress: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: '2026-05-07T10:30:00.000Z',
    description: 'Timestamp of the last successful refresh',
  })
  @IsDate()
  @IsOptional()
  @Expose()
  @Type(() => Date)
  lastUsedAt: Date | null;

  @ApiProperty({
    type: Date,
    example: '2026-05-14T10:30:00.000Z',
    description: 'When the refresh token expires',
  })
  @IsDate()
  @Expose()
  @Type(() => Date)
  expiresAt: Date;
}
