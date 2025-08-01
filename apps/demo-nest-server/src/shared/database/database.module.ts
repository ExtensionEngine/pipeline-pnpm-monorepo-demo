import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class DatabaseModule {
  static forRoot(options: MikroOrmModuleOptions = {}): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          driver: PostgreSqlDriver,
          useFactory: (config: ConfigService) => ({
            ...config.get('database'),
            autoLoadEntities: true,
            ...options,
          }),
        }),
      ],
    };
  }
}
