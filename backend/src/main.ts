import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Deshabilitar devtools estableciendo NODE_ENV a production si no está definido
  // o forzando la desactivación de devtools
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    snapshot: false,
    abortOnError: false,
  });

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
