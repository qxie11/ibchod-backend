import { Module } from '@nestjs/common';
import { SmartphoneService } from './smartphone.service';
import { SmartphoneController } from './smartphone.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from '../common/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  providers: [SmartphoneService],
  controllers: [SmartphoneController],
})
export class SmartphoneModule {}
