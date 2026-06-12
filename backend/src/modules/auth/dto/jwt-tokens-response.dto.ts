import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class JwtTokensResponseDto {
  constructor(partial: Partial<JwtTokensResponseDto>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token; send in Authorization: Bearer <token>',
  })
  @IsString()
  @Expose()
  accessToken: string;
}
