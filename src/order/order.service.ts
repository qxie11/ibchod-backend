import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateOrderDto } from './create-order.dto';
import { EmailService, OrderEmailData } from '../common/email/email.service';

@Injectable()
export class OrderService {
  private prisma = new PrismaClient();

  constructor(private readonly emailService: EmailService) {}

  async create(dto: CreateOrderDto) {
    const items = await Promise.all(
      dto.items.map(async (item) => {
        const smartphone = await this.prisma.smartphone.findUnique({
          where: { id: item.smartphoneId },
        });
        return { smartphone, quantity: item.quantity };
      }),
    );

    const order = await this.prisma.order.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        message: dto.message,
        items: items,
      },
    });

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.smartphone?.price || 0) * item.quantity,
      0,
    );

    // Prepare email data
    const emailData: OrderEmailData = {
      orderId: order.id,
      customerName: dto.name,
      customerEmail: dto.email,
      customerPhone: dto.phone,
      message: dto.message,
      items: items.map((item) => ({
        smartphone: {
          name: item.smartphone?.name || 'Unknown',
          price: item.smartphone?.price || 0,
          capacity: item.smartphone?.capacity || 0,
          color: item.smartphone?.color || 'Unknown',
        },
        quantity: item.quantity,
      })),
      totalAmount,
    };

    // Send email notifications
    try {
      // Send notification to admin
      await this.emailService.sendOrderNotification(emailData);
      
      // Send confirmation to customer
      await this.emailService.sendOrderConfirmation(emailData);
      
      console.log(`Email notifications sent for order #${order.id}`);
    } catch (error) {
      console.error('Failed to send email notifications:', error);
      // Don't throw error to avoid breaking the order creation
      // The order is still created successfully
    }

    return order;
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
