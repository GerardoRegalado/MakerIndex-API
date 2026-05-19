import { describe, expect, it } from 'vitest';
import { scraperConfig } from '../../src/modules/scraper/scraper.config.js';

describe('scraperConfig', () => {
  it('uses conservative defaults', () => {
    expect(scraperConfig).toEqual({
      enabled: false,
      timeoutMs: 15000,
      maxRetries: 1,
      minDelayMs: 3000,
    });
  });
});
