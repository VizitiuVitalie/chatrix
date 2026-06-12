import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { OwnUserDto } from '../../users/dto/own-user.dto';

export class LoginResponseDto {
  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token; send in Authorization: Bearer <token>',
  })
  @IsString()
  @Expose()
  accessToken: string;

  @ApiProperty({ type: OwnUserDto })
  @ValidateNested()
  @Expose()
  @Type(() => OwnUserDto)
  user: OwnUserDto;
}
