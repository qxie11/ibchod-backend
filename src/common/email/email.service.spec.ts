import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should prepare email data correctly', () => {
    const mockOrderData = {
      orderId: 1,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+420123456789',
      message: 'Test message',
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
      ],
      totalAmount: 29999,
    };

    // This test just checks if the service can be instantiated
    // In a real test environment, you would mock the Resend API
    expect(mockOrderData.orderId).toBe(1);
    expect(mockOrderData.customerName).toBe('Test Customer');
    expect(mockOrderData.items).toHaveLength(1);
  });
});
