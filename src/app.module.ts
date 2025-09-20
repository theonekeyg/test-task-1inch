import { Module } from '@nestjs/common';
import { GasModule } from './gas/gas.module';
import { AppConfigModule } from './config';
import { UniswapModule } from './uniswap/uniswap.module';

@Module({
  imports: [AppConfigModule, GasModule, UniswapModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
