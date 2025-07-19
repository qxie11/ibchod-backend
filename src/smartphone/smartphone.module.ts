import { Module } from '@nestjs/common';
import { SmartphoneService } from './smartphone.service';
import { SmartphoneController } from './smartphone.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SmartphoneService],
  controllers: [SmartphoneController],
})
export class SmartphoneModule {}
