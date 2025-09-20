import { Module } from '@nestjs/common';
import { GasController } from './gas.controller';
import { GasService } from './gas.service';
import { AppConfigModule } from '../config';

@Module({
  imports: [AppConfigModule],
  controllers: [GasController],
  providers: [GasService],
})
export class GasModule {}
