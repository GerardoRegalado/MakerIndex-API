import { describe, expect, it } from 'vitest';
import {
  ScraperDisabledError,
  ScraperParseError,
  ScraperRateLimitedError,
  ScraperTimeoutError,
  UnsupportedScraperInputError,
} from '../../src/modules/scraper/scraper.errors.js';

describe('scraper errors', () => {
  it('uses stable names without sensitive details', () => {
    const errors = [
      new ScraperDisabledError(),
      new UnsupportedScraperInputError(),
      new ScraperTimeoutError(),
      new ScraperParseError(),
      new ScraperRateLimitedError(),
    ];

    expect(errors.map((error) => error.name)).toEqual([
      'ScraperDisabledError',
      'UnsupportedScraperInputError',
      'ScraperTimeoutError',
      'ScraperParseError',
      'ScraperRateLimitedError',
    ]);
  });
});
