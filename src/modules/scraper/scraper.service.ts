import {
  ScraperDisabledError,
  UnsupportedScraperInputError,
} from './scraper.errors.js';
import { scraperConfig } from './scraper.config.js';
import { parseMakerWorldUrl } from '../../utils/parse-makerworld-url.js';
import type { ScrapedMakerModel, ScraperInput } from './scraper.types.js';

export type MakerWorldScraperTarget = {
  makerWorldId: number;
  normalizedUrl: string;
};

export const buildMakerWorldModelUrl = (makerWorldId: number): string => {
  if (!Number.isSafeInteger(makerWorldId) || makerWorldId <= 0) {
    throw new UnsupportedScraperInputError(
      'MakerWorld model ID must be a positive integer.',
    );
  }

  return `https://makerworld.com/en/models/${makerWorldId}`;
};

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

export const resolveMakerWorldScraperTarget = (
  input: ScraperInput,
): MakerWorldScraperTarget => {
  validateScraperInput(input);

  try {
    if (input.url) {
      const parsedUrl = parseMakerWorldUrl(input.url);

      return {
        makerWorldId: parsedUrl.makerWorldId,
        normalizedUrl: parsedUrl.normalizedUrl,
      };
    }

    if (input.makerWorldId) {
      return {
        makerWorldId: input.makerWorldId,
        normalizedUrl: buildMakerWorldModelUrl(input.makerWorldId),
      };
    }
  } catch (error) {
    if (error instanceof UnsupportedScraperInputError) {
      throw error;
    }

    throw new UnsupportedScraperInputError('A valid MakerWorld URL is required.');
  }

  throw new UnsupportedScraperInputError(
    'A MakerWorld URL or makerWorldId is required.',
  );
};

export const fetchMakerWorldModelMetadata = async (
  input: ScraperInput,
): Promise<ScrapedMakerModel> => {
  const target = resolveMakerWorldScraperTarget(input);

  if (!scraperConfig.enabled) {
    throw new ScraperDisabledError('Scraper is disabled.');
  }

  const { scrapeMakerWorldModelPage } = await import('./makerworld.browser.js');

  return scrapeMakerWorldModelPage(target);
};
