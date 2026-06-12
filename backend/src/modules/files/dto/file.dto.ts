import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { FileKind } from '../enums/file-kind.enum';

export class FileDto extends AbstractDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({ enum: FileKind, example: FileKind.MESSAGE_ATTACHMENT })
  @IsEnum(FileKind)
  @Expose()
  kind: FileKind;

  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  @Expose()
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @Expose()
  mimeType: string;

  @ApiProperty({ example: 1_234_567 })
  @IsInt()
  @Expose()
  sizeBytes: number;

  @ApiProperty({
    example: 'http://localhost:4321/api/files/42',
    description:
      'Download URL. Avatars point at MinIO directly; attachments are proxied through this API (membership-gated).',
  })
  @IsString()
  @Expose()
  downloadUrl: string;

  @ApiProperty({
    nullable: true,
    example: null,
    description:
      'WebP thumbnail URL (images only). `null` for non-image files.',
  })
  @IsString()
  @IsOptional()
  @Expose()
  thumbnailUrl: string | null;

  @ApiProperty({
    nullable: true,
    example: 1280,
    description:
      'Displayed image width in pixels (oriented). `null` for non-image files. Lets the client reserve the aspect-ratio box before the image loads.',
  })
  @IsInt()
  @IsOptional()
  @Expose()
  width: number | null;

  @ApiProperty({
    nullable: true,
    example: 960,
    description:
      'Displayed image height in pixels (oriented). `null` for non-image files.',
  })
  @IsInt()
  @IsOptional()
  @Expose()
  height: number | null;
}
