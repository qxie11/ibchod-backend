import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = 'S3_CLIENT';

export const S3Provider: Provider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService) => {
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = configService.get<string>('AWS_REGION', 'eu-north-1');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are not configured');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Let AWS SDK automatically determine the correct endpoint
    });
  },
  inject: [ConfigService],
};
