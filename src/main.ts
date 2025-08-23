import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParserModule from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure CORS with explicit options
  app.enableCors({
    origin: [
      'https://iobchod.shop',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.use(cookieParserModule());

  const config = new DocumentBuilder()
    .setTitle('IObchod')
    .setDescription('API documentation for smartphone store')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // For Vercel serverless, we don't need to listen on a port
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    await app.listen(process.env.PORT ?? 4000);
  }

  return app;
}

// Export for Vercel serverless
const app = bootstrap();

// Export the handler for Vercel
export default app;
