import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';
import { RPC_PROVIDER } from '../ethrpc';

/**
 * Responsibilities
 * - Maintains a background-polling loop to fetch the latest Ethereum gas price
 *   from the configured JSON-RPC endpoint (`ETH_RPC_URL`).
 * - Caches the most recent gas price so that the HTTP endpoint can serve
 *   responses with minimal latency without performing an on-demand RPC call.
 *
 * How it works
 * - On startup (`onModuleInit`), the service performs an immediate fetch to
 *   warm the cache (best-effort; failures are logged) and then starts a
 *   `setInterval` polling loop with the interval specified by
 *   `GAS_FETCH_INTERVAL_MS` in the app config.
 * - The private `updateGasPrice()` method calls `provider.send('eth_gasPrice', [])`,
 *   parses the returned hex string into a decimal number (wei), and updates the
 *   in-memory cache: `{ gasPriceRaw, gasPrice }`.
 * - The public `getGasPrice()` returns the cached snapshot.
 *
 * Performance
 * - Because requests are served from memory, the `/gasPrice` endpoint exhibits
 *   very low latency (typically a few milliseconds), while background polling
 *   keeps values reasonably fresh.
 */
@Injectable()
export class GasService implements OnModuleInit, OnModuleDestroy {
  private provider: JsonRpcProvider;
  private readonly logger = new Logger(GasService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private gasPriceFetchIntervalMs: number;

  private cache: { gasPriceRaw: string; gasPrice: number } | null = null;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(RPC_PROVIDER) provider: JsonRpcProvider,
  ) {
    this.gasPriceFetchIntervalMs = config.GAS_FETCH_INTERVAL_MS;
    this.provider = provider;
  }

  async onModuleInit() {
    // Warm cache immediately on startup
    await this.updateGasPrice();

    // Start background polling
    this.logger.log(
      `Starting background gas price polling with interval ${this.gasPriceFetchIntervalMs}ms`,
    );
    this.pollTimer = setInterval(() => {
      this.updateGasPrice().catch((err) =>
        this.logger.warn(
          `Background gas price update failed: ${err?.message ?? err}`,
        ),
      );
    }, this.gasPriceFetchIntervalMs);
  }

  onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // updateGasPrice fetches the current gas price and updates local cache.
  private async updateGasPrice() {
    try {
      const gasPriceRes: string = await this.provider.send('eth_gasPrice', []);
      const gasPrice = parseInt(gasPriceRes, 16);
      this.cache = { gasPriceRaw: gasPriceRes, gasPrice };
      this.logger.debug(`Gas price updated. gasPrice=${gasPrice}`);
    } catch (err: any) {
      this.logger.error(`Failed to fetch gas price: ${err?.message ?? err}`);
      // keep previous cache on failure
    }
  }

  // getGasPrice reads the gas price value stored in the cache and returns it. If gas price value
  // is not present in the cache, fetches it.
  async getGasPrice() {
    // Return cached value; background task maintains freshness
    if (!this.cache) {
      // In case cache is not ready yet, do a best-effort immediate update
      await this.updateGasPrice();
    }

    return {
      gasPriceRaw: this.cache?.gasPriceRaw ?? null,
      gasPrice: this.cache?.gasPrice ?? null,
    };
  }
}
