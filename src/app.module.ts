import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GasModule } from './gas/gas.module';
import { AppConfigModule } from './config';

@Module({
  imports: [AppConfigModule, GasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
