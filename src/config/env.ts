import 'dotenv/config';
import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_VERSION: z.string().default('0.1.0'),
  API_ROUTE_VERSION: z.string().default('v1'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  SCRAPER_ENABLED: booleanFromEnv.default(false),
  SCRAPER_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  SCRAPER_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  SCRAPER_MIN_DELAY_MS: z.coerce.number().int().positive().default(3000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.flatten().fieldErrors;
  throw new Error(`Invalid environment variables: ${JSON.stringify(details)}`);
}

export const env = parsedEnv.data;
