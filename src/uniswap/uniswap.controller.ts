import { Controller, Get, Param } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { ParseBigIntPipe, VerifyEthAddressPipe } from '../common/pipes';

@Controller()
export class UniswapController {
  constructor(private readonly uniswapService: UniswapService) {}

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  async returnHandler(
    @Param('fromTokenAddress', new VerifyEthAddressPipe())
    fromTokenAddress: string,
    @Param('toTokenAddress', new VerifyEthAddressPipe()) toTokenAddress: string,
    @Param('amountIn', new ParseBigIntPipe()) amountIn: bigint,
  ) {
    return this.uniswapService.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountIn,
    );
  }
}
