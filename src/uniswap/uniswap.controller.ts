import { Controller, Get, Param } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { EthAddressParam } from '../common/decorators/eth-address';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';

@Controller()
export class UniswapController {
  constructor(private readonly uniswapService: UniswapService) {}

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  async returnHandler(
    @EthAddressParam('fromTokenAddress') fromTokenAddress: string,
    @EthAddressParam('toTokenAddress') toTokenAddress: string,
    @Param('amountIn', new ParseBigIntPipe()) amountIn: bigint,
  ) {
    return this.uniswapService.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountIn,
    );
  }
}
