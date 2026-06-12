import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class VapidPublicKeyDto {
  @ApiProperty({
    example:
      'BN3caAC5VfuGWQDsqoEL-h-Lp49fnz4FcyyrkhoR5UbGl3WgvaB5CFRElj1XEXb4xWTKTKKKppLKV-qjpDwqbx0',
    description: 'VAPID public key (base64url-encoded P-256 point).',
  })
  @IsString()
  @Expose()
  publicKey: string;
}
