import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrderService {
  private prisma = new PrismaClient();

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        message: dto.message,
        items: dto.items as unknown as object,
      },
    });
  }

  findAll() {
    return this.prisma.order.findMany();
  }

  findById(id: number) {
    return this.prisma.order.findUnique({ where: { id } });
  }

  update(id: number, dto: Partial<CreateOrderDto>) {
    const data = {
      ...(dto?.email !== undefined && { email: dto.email }),
      ...(dto?.phone !== undefined && { phone: dto.phone }),
      ...(dto?.name !== undefined && { name: dto.name }),
      ...(dto?.message !== undefined && { message: dto.message }),
      ...(dto?.items !== undefined && {
        items: dto.items as unknown as object,
      }),
    };
    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }
}
