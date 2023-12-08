import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { DatabaseModule } from 'shared/database/database.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from 'user.entity';
import { HealthController } from 'health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig] }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: { target: 'pino-pretty' },
        redact: ['req.headers.authorization'],
        quietReqLogger: true,
      },
    }),
    DatabaseModule.forRoot(),
    MikroOrmModule.forFeature([User]),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
