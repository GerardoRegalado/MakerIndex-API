import {
  ScraperDisabledError,
  UnsupportedScraperInputError,
} from './scraper.errors.js';
import { scraperConfig } from './scraper.config.js';
import type { ScrapedMakerModel, ScraperInput } from './scraper.types.js';

const validateScraperInput = (input: ScraperInput) => {
  if (input.source !== 'makerworld') {
    throw new UnsupportedScraperInputError('Only MakerWorld scraping is supported.');
  }

  if (!input.url && !input.makerWorldId) {
    throw new UnsupportedScraperInputError(
      'A MakerWorld URL or makerWorldId is required.',
    );
  }
};

export const fetchMakerWorldModelMetadata = async (
  input: ScraperInput,
): Promise<ScrapedMakerModel> => {
  validateScraperInput(input);

  if (!scraperConfig.enabled) {
    throw new ScraperDisabledError('Scraper is disabled.');
  }

  // TODO: Implement conservative MakerWorld scraping in the future phase.
  // This placeholder intentionally does not call MakerWorld, fetch, Prisma, or Playwright.
  throw new ScraperDisabledError('MakerWorld scraper is not implemented yet.');
};
