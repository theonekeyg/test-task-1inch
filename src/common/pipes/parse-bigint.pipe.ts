import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Converts an incoming string value into a bigint.
 *
 * Validation
 * - Accepts only non-negative base-10 integer strings (regex: `/^[0-9]+$/`).
 * - Disallows decimals, signs, hex prefixes (e.g., `0x`), separators, or whitespace.
 *
 * Behavior
 * - On valid input, returns `BigInt(value)`.
 * - On invalid input, throws `BadRequestException` with a descriptive message.
 *
 * Example
 * - `@Param('amountIn', new ParseBigIntPipe()) amountIn: bigint`
 */
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
