import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TiposModule } from './tipos/tipos.module';
import { CafesModule } from './cafes/cafes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // ConfigModule intentará leer variables del sistema, pero no fallará si no hay .env
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // Le decimos que no se preocupe si no encuentra el archivo .env
    }),

    TiposModule,
    CafesModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Detectamos si estamos en producción (Render)
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          
          // Si existe la variable de entorno (Nube), úsala.
          // Si no existe (Local), usa el valor fijo después del '||'.
          
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USER') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_NAME') || 'cafedb',
          
          // Configuración SSL: Obligatoria en Render, pero da error en local.
          // La activamos solo si estamos en producción o si la variable DB_SSL es 'true'
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          
          autoLoadEntities: true,
          
          // Sincronizar solo si NO estamos en producción
          synchronize: true,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
