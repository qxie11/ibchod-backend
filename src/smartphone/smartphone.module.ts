import { Module } from '@nestjs/common';
import { SmartphoneService } from './smartphone.service';
import { SmartphoneController } from './smartphone.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from '@/common/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  providers: [SmartphoneService],
  controllers: [SmartphoneController],
})
export class SmartphoneModule {}
