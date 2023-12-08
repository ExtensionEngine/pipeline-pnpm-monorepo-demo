import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  const config = app.get(ConfigService);
  const port = config.get<number>('app.port')!;

  app.enableShutdownHooks();
  app.setGlobalPrefix('/api');
  app.enableCors();
  app.useLogger(logger);

  await app.listen(port, () => {
    logger.log(`🚀 Application is listening on port ${port}`);
  });
}
bootstrap();
