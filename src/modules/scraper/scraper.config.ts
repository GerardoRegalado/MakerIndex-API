import { env } from '../../config/env.js';

export type ScraperConfig = {
  enabled: boolean;
  timeoutMs: number;
  maxRetries: number;
  minDelayMs: number;
};

export const scraperConfig: ScraperConfig = {
  enabled: env.SCRAPER_ENABLED,
  timeoutMs: env.SCRAPER_TIMEOUT_MS,
  maxRetries: env.SCRAPER_MAX_RETRIES,
  minDelayMs: env.SCRAPER_MIN_DELAY_MS,
};
