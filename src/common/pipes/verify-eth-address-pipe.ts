import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Validates an Ethereum address string.
 *
 * Validation
 * - Requires the canonical hex format with 0x prefix and exactly 40 hex chars:
 *   regex `/^0x[a-fA-F0-9]{40}$/`
 *
 * Behavior
 * - On valid input, returns the original address string (casing preserved).
 * - On invalid input, throws `BadRequestException`.
 *
 * Example
 * - `@Param('fromTokenAddress', new VerifyEthAddressPipe()) from: string`
 */
@Injectable()
export class VerifyEthAddressPipe implements PipeTransform<string, string> {
  private readonly pattern = /^0x[a-fA-F0-9]{40}$/;

  transform(value: string): string {
    if (!value || !this.pattern.test(value)) {
      throw new BadRequestException(
        `Invalid Ethereum address: ${value}. Expected format: 0x[a-fA-F0-9]{40}`,
      );
    }

    return value; // preserve original casing
  }
}
