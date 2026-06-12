import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { AppLogger } from '../../common/logger/app-logger.service';
import { StoragePutOptions } from './interfaces/storage-put-options.interface';
import { StorageService } from './storage.service';

@Injectable()
export class S3StorageService
  extends StorageService
  implements OnApplicationBootstrap
{
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlPrefix: string;

  constructor(
    config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext(S3StorageService.name);

    this.bucket = config.get<string>('S3_BUCKET')!;
    this.publicUrlPrefix = config.get<string>('S3_PUBLIC_URL')!;
    this.client = new S3Client({
      endpoint: config.get<string>('S3_ENDPOINT')!,
      region: config.get<string>('S3_REGION')!,
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: config.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  public async onApplicationBootstrap(): Promise<void> {
    await this.ensureBucket();
    await this.applyAvatarsPolicy();
  }

  public async put(
    key: string,
    body: Buffer,
    options: StoragePutOptions,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
      }),
    );
    this.logger.debug(
      'put',
      { key, size: body.byteLength, contentType: options.contentType },
      'Object uploaded',
    );
  }

  public async getStream(key: string): Promise<Readable> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!result.Body) {
      throw new Error(`Empty response body for key "${key}"`);
    }

    return result.Body as Readable;
  }

  public async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.debug('delete', { key }, 'Object deleted');
  }

  public async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err) {
      if (this.isNotFound(err)) return false;
      throw err;
    }
  }

  public getPublicUrl(key: string): string {
    return `${this.publicUrlPrefix}/${key}`;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.debug(
        'ensureBucket',
        { bucket: this.bucket },
        'Bucket exists',
      );
      return;
    } catch (err) {
      if (!this.isNotFound(err)) {
        throw err;
      }
    }
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    this.logger.info('ensureBucket', { bucket: this.bucket }, 'Bucket created');
  }

  private async applyAvatarsPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadAvatars',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/avatars/*`],
        },
      ],
    };
    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy),
      }),
    );
    this.logger.info(
      'applyAvatarsPolicy',
      { bucket: this.bucket, prefix: 'avatars/' },
      'Anonymous-read policy applied',
    );
  }

  private isNotFound(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const name = (err as { name?: string; Code?: string }).name;
    return (
      name === 'NotFound' || name === 'NoSuchKey' || name === 'NoSuchBucket'
    );
  }
}
