import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { metricsMiddleware } from './metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora propiedades que no estén definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no definidas en el DTO
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  // Middleware que alimenta los contadores/histogramas de Prometheus.
  app.use(metricsMiddleware);

  // Un único servidor: API REST y /metrics comparten el puerto 3000.
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
