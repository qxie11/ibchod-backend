import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Provider } from './s3.provider';
import { S3Controller } from './s3.controller';

@Module({
  imports: [ConfigModule],
  controllers: [S3Controller],
  providers: [S3Provider, S3Service],
  exports: [S3Service],
})
export class S3Module {}
