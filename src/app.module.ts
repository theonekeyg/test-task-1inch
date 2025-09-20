import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GasModule } from './gas/gas.module';
import { AppConfigModule } from './config';
import { UniswapModule } from './uniswap/uniswap.module';

@Module({
  imports: [AppConfigModule, GasModule, UniswapModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
