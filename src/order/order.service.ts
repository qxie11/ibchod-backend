import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrderService {
  private prisma = new PrismaClient();

  async create(dto: CreateOrderDto) {
    const items = await Promise.all(
      dto.items.map(async (item) => {
        const smartphone = await this.prisma.smartphone.findUnique({
          where: { id: item.smartphoneId },
        });
        return { smartphone, quantity: item.quantity };
      }),
    );

    return this.prisma.order.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        message: dto.message,
        items: items,
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
