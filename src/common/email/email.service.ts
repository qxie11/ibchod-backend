import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

export interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message?: string;
  items: Array<{
    smartphone: {
      name: string;
      price: number;
      capacity: number;
      color: string;
    };
    quantity: number;
  }>;
  totalAmount: number;
}

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendOrderNotification(orderData: OrderEmailData) {
    try {
      const itemsHtml = orderData.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold; color: #007AFF;">${item.smartphone.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              💾 ${item.smartphone.capacity}GB | 🎨 ${item.smartphone.color}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 2px;">
              Цена за единицу: ${item.smartphone.price.toFixed(2)} Kč
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">
            ${item.quantity} шт.
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #007AFF;">
            ${(item.smartphone.price * item.quantity).toFixed(2)} Kč
          </td>
        </tr>
      `,
        )
        .join('');

      const orderDate = new Date().toLocaleString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Новый заказ #${orderData.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007AFF, #0056CC); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 12px 12px; }
            .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #007AFF; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .items-table th { background: #f5f5f5; padding: 15px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 25px; padding: 20px; background: #007AFF; color: white; border-radius: 8px; }
            .stats { display: flex; justify-content: space-between; margin: 20px 0; }
            .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-number { font-size: 24px; font-weight: bold; color: #007AFF; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            .message-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🛒 Новый заказ #${orderData.orderId}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">IObchod Store - Уведомление о новом заказе</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${orderData.items.length}</div>
                  <div class="stat-label">Товаров в заказе</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                  <div class="stat-label">Общее количество</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${orderData.totalAmount.toFixed(0)} Kč</div>
                  <div class="stat-label">Общая сумма</div>
                </div>
              </div>

              <div class="order-info">
                <h3 style="margin-top: 0; color: #007AFF;">👤 Информация о клиенте</h3>
                <p><strong>Имя:</strong> ${orderData.customerName}</p>
                <p><strong>Email:</strong> <a href="mailto:${orderData.customerEmail}" style="color: #007AFF;">${orderData.customerEmail}</a></p>
                <p><strong>Телефон:</strong> <a href="tel:${orderData.customerPhone}" style="color: #007AFF;">${orderData.customerPhone}</a></p>
                ${
                  orderData.message
                    ? `
                <div class="message-box">
                  <strong>💬 Сообщение от клиента:</strong><br>
                  ${orderData.message}
                </div>
                `
                    : ''
                }
              </div>
              
              <h3 style="color: #007AFF;">📱 Товары в заказе</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th style="text-align: center;">Количество</th>
                    <th style="text-align: right;">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="total">
                <strong>💰 Общая сумма заказа: ${orderData.totalAmount.toFixed(2)} Kč</strong>
              </div>
              
              <div class="footer">
                <p><strong>📅 Заказ создан:</strong> ${orderDate}</p>
                <p><strong>🆔 Номер заказа:</strong> #${orderData.orderId}</p>
                <p style="margin-top: 15px; font-size: 12px;">
                  Это автоматическое уведомление от системы IObchod Store.<br>
                  Рекомендуется связаться с клиентом в течение 24 часов.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: 'IObchod Store <noreply@iobchod.cz>',
        to: [process.env.ADMIN_EMAIL || 'iobchodshop@gmail.com'],
        subject: `Новый заказ #${orderData.orderId} от ${orderData.customerName}`,
        html: htmlContent,
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@iobchod.cz>',
          Precedence: 'bulk',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
        replyTo: 'orders@iobchod.cz',
      });

      if (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Order notification email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(orderData: OrderEmailData) {
    try {
      const itemsHtml = orderData.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold; color: #34C759;">${item.smartphone.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              💾 ${item.smartphone.capacity}GB | 🎨 ${item.smartphone.color}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 2px;">
              Цена за единицу: ${item.smartphone.price.toFixed(2)} Kč
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">
            ${item.quantity} шт.
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #34C759;">
            ${(item.smartphone.price * item.quantity).toFixed(2)} Kč
          </td>
        </tr>
      `,
        )
        .join('');

      const orderDate = new Date().toLocaleString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Подтверждение заказа #${orderData.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34C759, #28A745); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 12px 12px; }
            .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #34C759; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .items-table th { background: #f5f5f5; padding: 15px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 25px; padding: 20px; background: #34C759; color: white; border-radius: 8px; }
            .stats { display: flex; justify-content: space-between; margin: 20px 0; }
            .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-number { font-size: 24px; font-weight: bold; color: #34C759; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            .next-steps { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666; font-size: 14px; }
            .contact-info { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✅ Спасибо за ваш заказ!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Заказ #${orderData.orderId} успешно создан</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${orderData.items.length}</div>
                  <div class="stat-label">Товаров заказано</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                  <div class="stat-label">Общее количество</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${orderData.totalAmount.toFixed(0)} Kč</div>
                  <div class="stat-label">Общая сумма</div>
                </div>
              </div>

              <div class="order-info">
                <h3 style="margin-top: 0; color: #34C759;">📋 Детали заказа</h3>
                <p><strong>Номер заказа:</strong> #${orderData.orderId}</p>
                <p><strong>Дата заказа:</strong> ${orderDate}</p>
                <p><strong>Статус:</strong> <span style="color: #34C759; font-weight: bold;">✅ Подтвержден</span></p>
              </div>
              
              <h3 style="color: #34C759;">📱 Заказанные товары</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th style="text-align: center;">Количество</th>
                    <th style="text-align: right;">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="total">
                <strong>💰 Общая сумма заказа: ${orderData.totalAmount.toFixed(2)} Kč</strong>
              </div>

              <div class="next-steps">
                <h4 style="margin-top: 0; color: #155724;">📞 Что дальше?</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Мы свяжемся с вами в течение 24 часов для подтверждения заказа</li>
                  <li>Обсудим способ оплаты и доставки</li>
                  <li>Ответим на все ваши вопросы</li>
                </ul>
              </div>

              <div class="contact-info">
                <h4 style="margin-top: 0; color: #0056CC;">📞 Контактная информация</h4>
                <p><strong>Email:</strong> <a href="mailto:iobchodshop@gmail.com" style="color: #0056CC;">iobchodshop@gmail.com</a></p>
                <p><strong>Телефон:</strong> <a href="tel:+420123456789" style="color: #0056CC;">+420 123 456 789</a></p>
                <p><strong>Время работы:</strong> Пн-Пт 9:00-18:00</p>
              </div>
              
              <div class="footer">
                <p><strong>🆔 Номер заказа:</strong> #${orderData.orderId}</p>
                <p><strong>📅 Дата заказа:</strong> ${orderDate}</p>
                <p style="margin-top: 15px; font-size: 12px;">
                  Спасибо за выбор IObchod Store!<br>
                  Мы ценим ваше доверие и сделаем все возможное, чтобы ваш заказ был выполнен быстро и качественно.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: 'IObchod Store <orders@iobchod.cz>',
        to: [orderData.customerEmail],
        subject: `Подтверждение заказа #${orderData.orderId}`,
        html: htmlContent,
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@iobchod.cz>',
          Precedence: 'bulk',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
        replyTo: 'support@iobchod.cz',
      });

      if (error) {
        console.error('Error sending confirmation email:', error);
        throw new Error(`Failed to send confirmation email: ${error.message}`);
      }

      console.log('Order confirmation email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}
