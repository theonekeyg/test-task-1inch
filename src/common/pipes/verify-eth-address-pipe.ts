import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class VerifyEthAddressPipe implements PipeTransform<string, string> {
  private readonly pattern = /^0x[a-fA-F0-9]{40}$/;

  transform(value: string): string {
    if (!value || !this.pattern.test(value)) {
      throw new BadRequestException(
        `Invalid Ethereum address: ${value}. Expected format: 0x[a-fA-F0-9]{40}`,
      );
    }
    return value;
  }
}
