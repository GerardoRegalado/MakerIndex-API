import { describe, expect, it } from 'vitest';
import {
  ScraperDisabledError,
  UnsupportedScraperInputError,
} from '../../src/modules/scraper/scraper.errors.js';
import {
  buildMakerWorldModelUrl,
  fetchMakerWorldModelMetadata,
  resolveMakerWorldScraperTarget,
} from '../../src/modules/scraper/scraper.service.js';
import type { ScraperInput } from '../../src/modules/scraper/scraper.types.js';

describe('fetchMakerWorldModelMetadata', () => {
  it('builds a MakerWorld model URL from makerWorldId', () => {
    expect(buildMakerWorldModelUrl(550165)).toBe(
      'https://makerworld.com/en/models/550165',
    );
  });

  it('resolves a MakerWorld URL into a scraper target', () => {
    expect(
      resolveMakerWorldScraperTarget({
        source: 'makerworld',
        url: 'https://makerworld.com/en/models/550165-example#profileId-468516',
      }),
    ).toEqual({
      makerWorldId: 550165,
      normalizedUrl: 'https://makerworld.com/en/models/550165-example',
    });
  });

  it('throws ScraperDisabledError when SCRAPER_ENABLED=false', async () => {
    await expect(
      fetchMakerWorldModelMetadata({
        source: 'makerworld',
        makerWorldId: 550165,
      }),
    ).rejects.toBeInstanceOf(ScraperDisabledError);
  });

  it('throws UnsupportedScraperInputError for unsupported sources', async () => {
    await expect(
      fetchMakerWorldModelMetadata({
        source: 'unsupported',
        makerWorldId: 550165,
      } as unknown as ScraperInput),
    ).rejects.toBeInstanceOf(UnsupportedScraperInputError);
  });

  it('throws UnsupportedScraperInputError without url or makerWorldId', async () => {
    await expect(
      fetchMakerWorldModelMetadata({
        source: 'makerworld',
      }),
    ).rejects.toBeInstanceOf(UnsupportedScraperInputError);
  });

  it('does not call global fetch', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;

    globalThis.fetch = (() => {
      fetchCalled = true;
      throw new Error('External HTTP calls are not allowed in scraper foundation.');
    }) as typeof fetch;

    try {
      await expect(
        fetchMakerWorldModelMetadata({
          source: 'makerworld',
          url: 'https://makerworld.com/en/models/550165-example',
        }),
      ).rejects.toBeInstanceOf(ScraperDisabledError);
      expect(fetchCalled).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
