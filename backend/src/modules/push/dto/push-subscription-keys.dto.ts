import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class PushSubscriptionKeysDto {
  @ApiProperty({
    example:
      'BNJxw7mF6F-RrTQEv0n9o3hjp4OmHJ5HfV2RhO7l3wnLn8c6Q8Pq1XJZ1V_DyDe6N9R0p9wPGq3JOY1nGqQfvP4',
    description:
      'ECDH public key issued by the user agent (P-256, base64url). Together with `auth`, used to AES128GCM-encrypt the push payload per RFC 8291.',
  })
  @IsString()
  @MaxLength(255)
  p256dh: string;

  @ApiProperty({
    example: 'mZh2H_8b7lA9DqK5p4f6Vw',
    description: 'Auth secret (16-byte base64url) issued by the user agent.',
  })
  @IsString()
  @MaxLength(255)
  auth: string;
}
