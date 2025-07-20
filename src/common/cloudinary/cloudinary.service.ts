import { Injectable, Inject } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinaryType } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private cloudinary: typeof cloudinaryType,
  ) {}

  async uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder: 'images' },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(new Error(error.message));
          resolve(result as UploadApiResponse);
        },
      );
      stream.end(buffer);
    });
  }
}
