import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';
import {
  UniswapV2Factory,
  UniswapV2Factory__factory,
  ERC20__factory,
} from '../abi';

/**
 * Responsibilities
 * - Computes Uniswap V2-style output amounts entirely off-chain using on-chain
 *   state (token balances).
 * - Uses a configured Uniswap V2 Factory contract to discover the pair address
 *   for a given token pair, and reads reserves from the two ERC-20 contracts by
 *   querying `balanceOf(pair)` for each token.
 *
 * How it works
 * - On construction, the service creates an `ethers` `JsonRpcProvider` using the
 *   configured `ETH_RPC_URL` and connects a typed `UniswapV2Factory` instance
 *   at `UNISWAP_V2_FACTORY_ADDRESS`.
 */
@Injectable()
export class UniswapService {
  private readonly logger = new Logger(UniswapService.name);
  private provider: JsonRpcProvider;
  private uniswapV2Factory: UniswapV2Factory;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    const rpcUrl = this.config.ETH_RPC_URL;
    this.provider = new JsonRpcProvider(rpcUrl);
    this.uniswapV2Factory = UniswapV2Factory__factory.connect(
      this.config.UNISWAP_V2_FACTORY_ADDRESS,
      this.provider,
    );
  }

  /**
   * Computes the expected output amount (amountOut) for swapping `amountIn` of
   * `fromTokenAddress` into `toTokenAddress` on a Uniswap V2 pair, entirely
   * off-chain using current on-chain reserves.
   *
   * Steps:
   * - Resolve the pair address via `UniswapV2Factory.getPair(from, to)`.
   * - Read reserves by calling `ERC20.balanceOf(pair)` on both tokens.
   * - Apply the Uniswap V2 formula with 0.3% fee (997/1000):
   *   amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
   *
   * @param fromTokenAddress ERC-20 token address to swap from
   * @param toTokenAddress   ERC-20 token address to receive
   * @param amountIn         Input amount (in token smallest units)
   * @returns An object `{ amountOut: string }` where `amountOut` is the
   *          stringified bigint of the computed output amount
   * @throws NotFoundException when no pair exists for the provided token
   *         addresses (pair == 0x000...000)
   */
  async getAmountOut(
    fromTokenAddress: string,
    toTokenAddress: string,
    amountIn: bigint,
  ) {
    this.logger.log(
      `swapQuote called with from=${fromTokenAddress} to=${toTokenAddress} amountIn=${amountIn}`,
    );

    const pairAddress = await this.uniswapV2Factory.getPair(
      fromTokenAddress,
      toTokenAddress,
    );
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      throw new NotFoundException(
        'No pair found for the given token addresses',
      );
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
