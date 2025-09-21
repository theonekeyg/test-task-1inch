import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';
import { UniswapV2Factory, UniswapV2Factory__factory, ERC20__factory } from '../abi';

@Injectable()
export class UniswapService {
    private readonly logger = new Logger(UniswapService.name)
    private provider: JsonRpcProvider;
    private uniswapV2Factory: UniswapV2Factory;

    constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
        const rpcUrl = this.config.ETH_RPC_URL;
        this.provider = new JsonRpcProvider(rpcUrl);
        this.uniswapV2Factory = UniswapV2Factory__factory.connect(this.config.UNISWAP_V2_FACTORY_ADDRESS, this.provider)
    }

    async getAmountOut(fromTokenAddress: string, toTokenAddress: string, amountIn: bigint) {
        this.logger.log(`swapQuote called with from=${fromTokenAddress} to=${toTokenAddress} amountIn=${amountIn}`);
        
        const pairAddress = await this.uniswapV2Factory.getPair(fromTokenAddress, toTokenAddress);
        if (pairAddress === '0x0000000000000000000000000000000000000000') {
            throw new NotFoundException('No pair found for the given token addresses');
        }

        const inToken = ERC20__factory.connect(fromTokenAddress, this.provider);
        const inTokenReserve = await inToken.balanceOf(pairAddress);

        const outToken = ERC20__factory.connect(toTokenAddress, this.provider);
        const outTokenReserve = await outToken.balanceOf(pairAddress);

        const amountWithFee = amountIn * BigInt(997);
        const numerator = amountWithFee * outTokenReserve;
        const denominator = inTokenReserve * BigInt(1000) + amountWithFee;
        const amountOut = numerator / denominator;

        return { amountOut: amountOut.toString() };
    }
}