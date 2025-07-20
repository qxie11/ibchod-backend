import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [ConfigModule, CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, 'CLOUDINARY'],
})
export class CloudinaryModule {}
