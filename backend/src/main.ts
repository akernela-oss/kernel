import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppConfig, true>);

  // Structured logging via pino.
  app.useLogger(app.get(Logger));

  // Security & performance middleware. CSP disabled so the Swagger UI loads;
  // tighten it behind your reverse proxy in production.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  const origins = config.get('corsOrigins', { infer: true }) ?? ['*'];
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  const prefix = config.get('apiPrefix', { infer: true }) ?? 'api';
  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Defensive: ensure a validation pipe even if module-level provider changes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Presale Command Center API')
    .setDescription(
      'Backend for the luxury presale finance CRM — RBAC, audit log, KPI engine and alert queue.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('port', { infer: true }) ?? 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Presale Command Center API listening on port ${port} (prefix /${prefix})`);
}

void bootstrap();
