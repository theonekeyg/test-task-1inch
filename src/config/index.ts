import { Module, Provider } from '@nestjs/common';
import { z } from 'zod';

const envSchema = z
  .object({
    ETH_RPC_URL: z
      .string()
      .trim()
      .min(1, 'ETH_RPC_URL is required')
      .url('ETH_RPC_URL must be a valid URL')
      .refine((val) => /^https?:\/\//i.test(val), {
        message: 'ETH_RPC_URL must start with http:// or https://',
      }),
    PORT: z
      .coerce.number()
      .int('PORT must be an integer')
      .min(1, 'PORT must be between 1 and 65535')
      .max(65535, 'PORT must be between 1 and 65535')
      .default(3000),
    GAS_FETCH_INTERVAL_MS: z
      .coerce.number()
      .int('GAS_FETCH_INTERVAL_MS must be an integer')
      .min(100, 'GAS_FETCH_INTERVAL_MS must be >100')
      .default(5000),
    UNISWAP_V2_FACTORY_ADDRESS: z
      .string()
      .trim()
      .regex(/^0x[a-fA-F0-9]{40}$/i, 'UNISWAP_V2_FACTORY_ADDRESS must match 0x[a-fA-F0-9]{40}')
      .describe('Address of the Uniswap V2 Factory contract'),
  });

export type AppConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables and converts them into an AppConfig.
 * Throws a descriptive error if validation fails.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`Configuration validation failed: ${details}`);
  }

  return parsed.data;
}

// DI-friendly provider/token + module, to inject config directly
export const APP_CONFIG = Symbol('APP_CONFIG');

export const appConfigProvider: Provider = {
  provide: APP_CONFIG,
  useFactory: () => loadConfig(),
};

@Module({
  providers: [appConfigProvider],
  exports: [appConfigProvider],
})
export class AppConfigModule {}

