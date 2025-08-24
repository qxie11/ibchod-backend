import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from './s3.provider';

export interface UploadFileOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  bucket?: string;
}

export interface DeleteFileOptions {
  key: string;
  bucket?: string;
}

export interface GetSignedUrlOptions {
  key: string;
  operation: 'get' | 'put';
  expiresIn?: number;
  bucket?: string;
  contentType?: string;
}

@Injectable()
export class S3Service {
  private readonly defaultBucket: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
    this.defaultBucket = bucket;
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(options: UploadFileOptions): Promise<string> {
    const { key, buffer, contentType, bucket = this.defaultBucket } = options;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      return this.getFileUrl(key);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(options: DeleteFileOptions): Promise<void> {
    const { key, bucket = this.defaultBucket } = options;

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for file operations
   */
  async getSignedUrl(options: GetSignedUrlOptions): Promise<string> {
    const {
      key,
      operation,
      expiresIn = 3600,
      bucket = this.defaultBucket,
      contentType,
    } = options;

    let command;

    if (operation === 'get') {
      command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
    } else {
      command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });
    }

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(key: string, bucket?: string): string {
    const bucketName = bucket || this.defaultBucket;
    const region = this.configService.get<string>('AWS_REGION', 'eu-north-1');

    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generate a unique file key with timestamp
   */
  generateFileKey(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${extension}`;

    return folder ? `${folder}/${fileName}` : fileName;
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: UploadFileOptions[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(files: DeleteFileOptions[]): Promise<void> {
    const deletePromises = files.map((file) => this.deleteFile(file));
    await Promise.all(deletePromises);
  }
}
