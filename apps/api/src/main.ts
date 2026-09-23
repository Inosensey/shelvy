import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import { PrismaExceptionFilter } from './PrismaExceptionFilter';
import { HttpExceptionFilter } from './HttpExceptionFilter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { IncomingMessage } from 'http';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(
    '/stripe/webhook',
    bodyParser.raw({
      type: 'application/json',
      verify: (req: IncomingMessage & { rawBody?: Buffer }, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Shelvy API')
    .setDescription('Inventory management API for Shelvy application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth()
    .addCookieAuth('token')
    .setExternalDoc('Postman Collection', '/api-json')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      displayRequestDuration: true,
      filter: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shelvy API Docs',
  });
  // -------------------------------------------------

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
