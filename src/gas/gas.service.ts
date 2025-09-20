import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../config';
import type { AppConfig } from '../config';
import { JsonRpcProvider } from 'ethers';


@Injectable()
export class GasService {

  provider: JsonRpcProvider;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    const rpcUrl = this.config.ETH_RPC_URL;
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  async getGasPrice() {
    console.log("called getGasPrice()")

    const gasPriceRes: string = await this.provider.send('eth_gasPrice', []);
    const gasPrice = parseInt(gasPriceRes, 16);

    return {
      gasPriceRaw: gasPriceRes,
      gasPrice: gasPrice,
    };
  }
}
