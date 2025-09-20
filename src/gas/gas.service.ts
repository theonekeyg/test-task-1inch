import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';


@Injectable()
export class GasService implements OnModuleInit, OnModuleDestroy {

  private provider: JsonRpcProvider;
  private readonly logger = new Logger(GasService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private gasPriceFetchIntervalMs: number;
  // private readonly pollIntervalMs = 5_000; // adjust as needed

  private cache: { gasPriceRaw: string; gasPrice: number } | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    const rpcUrl = this.config.ETH_RPC_URL;
    this.gasPriceFetchIntervalMs = config.GAS_FETCH_INTERVAL_MS;
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  async onModuleInit() {
    // Warm cache immediately on startup
    await this.updateGasPrice();

    // Start background polling
    this.logger.log(`Starting background gas price polling with interval ${this.gasPriceFetchIntervalMs}ms`);
    this.pollTimer = setInterval(() => {
      this.updateGasPrice().catch((err) =>
        this.logger.warn(`Background gas price update failed: ${err?.message ?? err}`),
      );
    }, this.gasPriceFetchIntervalMs);
  }

  onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

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

  async getGasPrice() {
    // Return cached value; background task maintains freshness
    if (!this.cache) {
      // In rare case cache is not ready yet, do a best-effort immediate update
      await this.updateGasPrice();
    }

    return {
      gasPriceRaw: this.cache?.gasPriceRaw ?? null,
      gasPrice: this.cache?.gasPrice ?? null,
    };
  }
}
