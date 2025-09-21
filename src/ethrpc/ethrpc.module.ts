import { Global, Module } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG, type AppConfig } from '../config';
import { RPC_PROVIDER } from './tokens';

const rpcProvider = {
  provide: RPC_PROVIDER,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig) => {
    return new JsonRpcProvider(config.ETH_RPC_URL);
  },
};

/**
 * Provides a singleton `ethers.JsonRpcProvider` under the `RPC_PROVIDER` token.
 * This module centralizes creation of the Ethereum provider using the
 * application configuration (`ETH_RPC_URL`) and exports it so that feature
 * modules (e.g., `GasModule`, `UniswapModule`) can inject and reuse the same
 * instance instead of constructing their own. This avoids multiple provider
 * instantiations, keeps configuration in one place, and simplifies testing by
 * allowing a single injection token to be overridden.
 */
@Global()
@Module({
  providers: [rpcProvider],
  exports: [rpcProvider],
})
export class EthRpcModule {}
