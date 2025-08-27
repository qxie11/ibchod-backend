import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [EmailModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
