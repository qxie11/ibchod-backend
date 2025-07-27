import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SmartphoneModule } from './smartphone/smartphone.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_PIPE } from '@nestjs/core';
import { OrderModule } from './order/order.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './common/cloudinary/cloudinary.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    SmartphoneModule,
    PrismaModule,
    OrderModule,
    CloudinaryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CloudinaryService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
