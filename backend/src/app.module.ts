import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import { validationSchema } from './config/validation.schema';

import { DoggyModule } from './doggy/doggy.module';
import { AuthModule } from './auth/auth.module';
import { AvanceModule } from './avance/avance.module';
import { ExternalApiModule } from './external/external-api.module';
import { ProjectionModule } from './projection/projection.module';
import { ManualProjectionModule } from './manual-projection/manual-projection.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    DoggyModule,
    AuthModule,
    AvanceModule,
    ExternalApiModule,
    ProjectionModule,
    ManualProjectionModule,
  ],
})
export class AppModule {}
