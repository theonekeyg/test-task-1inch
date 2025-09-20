import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { APP_CONFIG } from './config';
import type { AppConfig } from './config';
import { Logger } from '@nestjs/common';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);
  const logger = new Logger('Bootstrap');
  logger.log(`Starting Nest application on port ${config.PORT}...`);
  await app.listen(config.PORT);
  const url = await app.getUrl();
  logger.log(`Application is running at ${url}`);
}
bootstrap();
