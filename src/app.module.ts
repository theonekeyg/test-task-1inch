import { Module } from '@nestjs/common';
import { GasModule } from './gas/gas.module';
import { AppConfigModule } from './config';
import { UniswapModule } from './uniswap/uniswap.module';
import { EthRpcModule } from './ethrpc';

@Module({
  imports: [AppConfigModule, EthRpcModule, GasModule, UniswapModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
