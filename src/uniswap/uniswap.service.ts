import { Injectable, Inject, Logger } from '@nestjs/common';
import { JsonRpcProvider, Contract } from 'ethers';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';
import { UNISWAP_V2_FACTORY_ABI } from '../abis';

@Injectable()
export class UniswapService {
    private readonly logger = new Logger(UniswapService.name)
    private provider: JsonRpcProvider;
    private uniswapV2Factory: Contract;

    constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
        const rpcUrl = this.config.ETH_RPC_URL;
        this.provider = new JsonRpcProvider(rpcUrl);
        this.uniswapV2Factory = new Contract(
            this.config.UNISWAP_V2_FACTORY_ADDRESS,
            UNISWAP_V2_FACTORY_ABI,
            this.provider
        );
    }

    async swapQuote(fromTokenAddress: string, toTokenAddress: string, amountIn: string) {
        this.logger.log(`swapQuote called with from=${fromTokenAddress} to=${toTokenAddress} amountIn=${amountIn}`);
        
        const pair = await this.uniswapV2Factory.getPair(fromTokenAddress, toTokenAddress);
        if (pair === '0x0000000000000000000000000000000000000000') {
            throw new Error('No pair found for the given token addresses');
        }
        
        return { fromTokenAddress, toTokenAddress, amountIn };
    }
}