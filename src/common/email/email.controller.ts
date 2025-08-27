import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async testEmail() {
    const testData = {
      orderId: 999,
      customerName: 'Test Customer with Details',
      customerEmail: 'genia1103200111032001@gmail.com',
      customerPhone: '+420123456789',
      message: 'Хочу заказать iPhone 15 Pro с доставкой в Прагу. Есть ли возможность оплаты картой? Также интересует гарантия.',
      items: [
        {
          smartphone: {
            name: 'iPhone 15 Pro',
            price: 29999,
            capacity: 256,
            color: 'Titan',
          },
          quantity: 1,
        },
        {
          smartphone: {
            name: 'iPhone 15',
            price: 13900,
            capacity: 128,
            color: 'Blue',
          },
          quantity: 2,
        },
      ],
      totalAmount: 57799,
    };

    try {
      // Send notification to admin
      await this.emailService.sendOrderNotification(testData);
      
      // Send confirmation to customer
      await this.emailService.sendOrderConfirmation(testData);
      
      return {
        success: true,
        message: 'Test emails sent successfully',
        orderId: testData.orderId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test emails',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
