import { Controller, Get } from '@nestjs/common';
import { GasService } from './gas.service';

@Controller()
export class GasController {
  constructor(private readonly gasService: GasService) {}

  @Get('gasPrice')
  async gasPrice() {
    return this.gasService.getGasPrice();
  }
}
