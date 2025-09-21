import { Module } from '@nestjs/common';
import { UniswapController } from './uniswap.controller';
import { UniswapService } from './uniswap.service';
import { AppConfigModule } from '../config';

@Module({
  imports: [AppConfigModule],
  controllers: [UniswapController],
  providers: [UniswapService],
})
export class UniswapModule {}
