import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Parses a positive integer string into bigint (no decimals allowed)
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  private readonly pattern = /^[0-9]+$/;

  transform(value: string): bigint {
    if (!this.pattern.test(value)) {
      throw new BadRequestException(
        `Invalid amount: ${value}. Must be a positive integer string (no decimals).`,
      );
    }
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`Invalid amount: ${value}.`);
    }
  }
}
