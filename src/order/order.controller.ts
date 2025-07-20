import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get()
  getAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.orderService.findById(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>) {
    return this.orderService.update(Number(id), dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.orderService.delete(Number(id));
  }
}
