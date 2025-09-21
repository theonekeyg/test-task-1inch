import { Module } from '@nestjs/common';
import { UniswapController } from './uniswap.controller';
import { UniswapService } from './uniswap.service';

@Module({
  imports: [],
  controllers: [UniswapController],
  providers: [UniswapService],
})
export class UniswapModule {}
